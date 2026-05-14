-- =========================================================================
-- policies.sql — Row Level Security
-- =========================================================================

-- Enable RLS everywhere ----------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.subjects                 enable row level security;
alter table public.units                    enable row level security;
alter table public.lessons                  enable row level security;
alter table public.questions                enable row level security;
alter table public.user_progress            enable row level security;
alter table public.user_question_attempts   enable row level security;
alter table public.user_stats               enable row level security;
alter table public.leagues                  enable row level security;
alter table public.league_members           enable row level security;
alter table public.badges                   enable row level security;
alter table public.user_badges              enable row level security;
alter table public.mock_exam_attempts       enable row level security;

-- profiles ----------------------------------------------------------------
-- A profile row is readable by its owner OR by anyone when profile_public.
drop policy if exists "profiles: select own"   on public.profiles;
drop policy if exists "profiles: leaderboard"  on public.profiles;
create policy "profiles: select public or own"
  on public.profiles for select
  using (auth.uid() = id or profile_public = true);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- public content (read for any authenticated user) ------------------------
create policy "subjects: read"  on public.subjects  for select using (auth.role() = 'authenticated');
create policy "units: read"     on public.units     for select using (auth.role() = 'authenticated');
create policy "lessons: read"   on public.lessons   for select using (auth.role() = 'authenticated');
create policy "badges: read"    on public.badges    for select using (auth.role() = 'authenticated');
create policy "leagues: read"   on public.leagues   for select using (auth.role() = 'authenticated');

-- questions: NEVER expose `correct` and `explanation_md` directly.
-- Reads must go through the `questions_public` view (no `correct` column).
-- Direct selects are blocked; service_role bypasses RLS for the seed script.
create policy "questions: deny direct read" on public.questions for select using (false);

-- per-user data -----------------------------------------------------------
create policy "uprogress: own all" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "uqa: own all" on public.user_question_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ustats: own all" on public.user_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lmembers: read all" on public.league_members for select
  using (auth.role() = 'authenticated');
create policy "lmembers: own write" on public.league_members
  for insert with check (auth.uid() = user_id);
create policy "lmembers: own update" on public.league_members
  for update using (auth.uid() = user_id);

create policy "ubadges: read own" on public.user_badges for select
  using (auth.uid() = user_id);
create policy "ubadges: insert own" on public.user_badges for insert
  with check (auth.uid() = user_id);

create policy "exam: own all" on public.mock_exam_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- View needs explicit grant ----------------------------------------------
grant select on public.questions_public to authenticated;

-- =========================================================================
-- Social layer (migration 0006)
-- =========================================================================

-- follows -----------------------------------------------------------------
-- Anyone authenticated can read the graph (we surface counts/lists publicly).
-- A user can create a follow only on their own behalf, only toward a profile
-- whose profile_public flag is true. A user can delete only their own follows.
drop policy if exists "follows: read"        on public.follows;
drop policy if exists "follows: insert own"  on public.follows;
drop policy if exists "follows: delete own"  on public.follows;
create policy "follows: read" on public.follows
  for select using (auth.role() = 'authenticated');
create policy "follows: insert own" on public.follows
  for insert with check (
    auth.uid() = follower_id
    and exists (
      select 1 from public.profiles
      where id = followed_id and profile_public = true
    )
  );
create policy "follows: delete own" on public.follows
  for delete using (auth.uid() = follower_id);

-- user_activities ---------------------------------------------------------
-- Direct SELECT: only the owner. Followers and the public read via the
-- `public_activities_v` view (which checks profile_public + kind filter).
-- INSERTs are performed server-side via service_role.
drop policy if exists "uacts: read own"      on public.user_activities;
drop policy if exists "uacts: read followed" on public.user_activities;
create policy "uacts: read own" on public.user_activities
  for select using (auth.uid() = user_id);
create policy "uacts: read followed" on public.user_activities
  for select using (
    exists (
      select 1 from public.follows
      where follower_id = auth.uid()
        and followed_id = user_activities.user_id
    )
  );
