-- =========================================================================
-- 0006_social.sql — Public profiles, follow graph, activity feed
-- =========================================================================
--
-- Adds the social layer on top of the existing profile/league system:
--   * Public profile fields (display_name, bio, country, color, public flag)
--   * Asymmetric follow graph (Duolingo-style)
--   * Materialized activity feed (lesson_completed, badge_earned, etc.)
--   * Case-insensitive username uniqueness
--   * View `public_activities_v` for the public Discover feed
--
-- Outfits and gems are introduced in a later migration (0007).

-- ------------------------------------------------------------------
-- profiles additions
-- ------------------------------------------------------------------
alter table public.profiles
  add column if not exists display_name   text,
  add column if not exists bio            text,
  add column if not exists country_code   char(2),
  add column if not exists profile_color  text not null default 'sky',
  add column if not exists profile_public boolean not null default true,
  add column if not exists joined_at      timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 280);

-- Case-insensitive uniqueness on username so @Foo and @foo can't both exist.
drop index if exists profiles_username_lower_idx;
create unique index profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

-- ------------------------------------------------------------------
-- follows — asymmetric (follower follows followed)
-- ------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followed_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self check (follower_id <> followed_id)
);
create index if not exists follows_followed_idx
  on public.follows (followed_id);
create index if not exists follows_follower_recent_idx
  on public.follows (follower_id, created_at desc);

-- ------------------------------------------------------------------
-- user_activities — append-only feed events
-- ------------------------------------------------------------------
create table if not exists public.user_activities (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in (
    'lesson_completed',
    'badge_earned',
    'league_promoted',
    'exam_passed',
    'streak_milestone',
    'outfit_unlocked',
    'jackpot_win'
  )),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists user_activities_user_recent_idx
  on public.user_activities (user_id, created_at desc);
create index if not exists user_activities_recent_idx
  on public.user_activities (created_at desc);

-- ------------------------------------------------------------------
-- public_activities_v — filtered view for the Discover tab
-- ------------------------------------------------------------------
-- Only "interesting" events are surfaced publicly, and only when the
-- producing profile has profile_public = true.
create or replace view public.public_activities_v as
  select a.id,
         a.user_id,
         a.kind,
         a.payload,
         a.created_at
  from   public.user_activities a
  join   public.profiles p on p.id = a.user_id
  where  p.profile_public = true
    and  (
      a.kind in ('exam_passed','league_promoted','outfit_unlocked')
      or (a.kind = 'badge_earned')
      or (
        a.kind = 'streak_milestone'
        and coalesce((a.payload->>'streak')::int, 0) >= 30
      )
    );

grant select on public.public_activities_v to authenticated;

-- ------------------------------------------------------------------
-- enable RLS on new tables (policies live in db/policies.sql)
-- ------------------------------------------------------------------
alter table public.follows         enable row level security;
alter table public.user_activities enable row level security;
