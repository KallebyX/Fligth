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
create policy "profiles: select own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own"   on public.profiles for update using (auth.uid() = id);
create policy "profiles: leaderboard"  on public.profiles for select
  using (true);  -- usernames are public for league display
-- (fine: only read; sensitive cols would need column-level restriction)

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
