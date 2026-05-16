-- =========================================================================
-- 0020_rls_consolidation.sql — Make Row Level Security idempotent & in-band
-- =========================================================================
--
-- Until now, RLS policies for `profiles` (and a few other base tables) lived
-- in `db/policies.sql`, a file that had to be applied OUT-OF-BAND. If a fresh
-- environment ran migrations but skipped policies.sql, those tables would
-- either be wide open (RLS off + grants) or blocked entirely (RLS on, no
-- policies), depending on the deploy path.
--
-- This migration consolidates the critical policies into the migration chain
-- so future environments can never drift. Every statement uses IF NOT EXISTS
-- / DROP+CREATE so it stays idempotent if `policies.sql` was already applied.

-- ----- enable RLS on every table that should have it ---------------------
alter table public.profiles                 enable row level security;
alter table public.user_progress            enable row level security;
alter table public.user_question_attempts   enable row level security;
alter table public.user_stats               enable row level security;
alter table public.league_members           enable row level security;
alter table public.user_badges              enable row level security;
alter table public.mock_exam_attempts       enable row level security;

-- ----- profiles ----------------------------------------------------------
-- Readable by owner OR by anyone when profile_public = true.
drop policy if exists "profiles: select own"            on public.profiles;
drop policy if exists "profiles: leaderboard"           on public.profiles;
drop policy if exists "profiles: select public or own"  on public.profiles;
drop policy if exists "profiles: update own"            on public.profiles;
drop policy if exists "profiles: insert self"           on public.profiles;

create policy "profiles: select public or own"
  on public.profiles for select
  using (auth.uid() = id or profile_public = true);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow the handle_new_user() trigger (and any retry path) to create the
-- profile row server-side. The trigger uses security definer so it bypasses
-- RLS, but we add this for defensiveness in case a client ever needs to
-- self-insert (e.g. recovery flow after a failed signup).
create policy "profiles: insert self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----- per-user data -----------------------------------------------------
drop policy if exists "uprogress: own all"  on public.user_progress;
create policy "uprogress: own all" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "uqa: own all"        on public.user_question_attempts;
create policy "uqa: own all" on public.user_question_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ustats: own all"     on public.user_stats;
create policy "ustats: own all" on public.user_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- public content (read for any authenticated user) ------------------
alter table public.subjects enable row level security;
alter table public.units    enable row level security;
alter table public.lessons  enable row level security;
alter table public.badges   enable row level security;
alter table public.leagues  enable row level security;
alter table public.questions enable row level security;

drop policy if exists "subjects: read" on public.subjects;
drop policy if exists "units: read"    on public.units;
drop policy if exists "lessons: read"  on public.lessons;
drop policy if exists "badges: read"   on public.badges;
drop policy if exists "leagues: read"  on public.leagues;
drop policy if exists "questions: deny direct read" on public.questions;

create policy "subjects: read"  on public.subjects  for select using (auth.role() = 'authenticated');
create policy "units: read"     on public.units     for select using (auth.role() = 'authenticated');
create policy "lessons: read"   on public.lessons   for select using (auth.role() = 'authenticated');
create policy "badges: read"    on public.badges    for select using (auth.role() = 'authenticated');
create policy "leagues: read"   on public.leagues   for select using (auth.role() = 'authenticated');

-- Questions: never expose `correct` / `explanation_md` directly. Reads must
-- go through the `questions_public` view. Direct selects are blocked;
-- service_role bypasses RLS for seed scripts.
create policy "questions: deny direct read"
  on public.questions for select using (false);

-- ----- league_members ---------------------------------------------------
drop policy if exists "lmembers: read all"    on public.league_members;
drop policy if exists "lmembers: own write"   on public.league_members;
drop policy if exists "lmembers: own update"  on public.league_members;
create policy "lmembers: read all" on public.league_members
  for select using (auth.role() = 'authenticated');
create policy "lmembers: own write" on public.league_members
  for insert with check (auth.uid() = user_id);
create policy "lmembers: own update" on public.league_members
  for update using (auth.uid() = user_id);

-- ----- user_badges -------------------------------------------------------
drop policy if exists "ubadges: read own"   on public.user_badges;
drop policy if exists "ubadges: insert own" on public.user_badges;
create policy "ubadges: read own" on public.user_badges
  for select using (auth.uid() = user_id);
create policy "ubadges: insert own" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- ----- mock_exam_attempts ------------------------------------------------
drop policy if exists "exam: own all" on public.mock_exam_attempts;
create policy "exam: own all" on public.mock_exam_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- grant on questions_public view (idempotent) -----------------------
grant select on public.questions_public to authenticated;

-- ----- profile lookup performance ----------------------------------------
-- /profile/[username] does a case-insensitive lookup; the index from 0006
-- already supports that. Adding a covering index for the avatar+name lookup
-- pattern used by leaderboard rows.
create index if not exists profiles_username_avatar_idx
  on public.profiles (username)
  include (display_name, avatar_url, profile_color)
  where username is not null and profile_public = true;
