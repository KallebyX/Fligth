-- =========================================================================
-- 0001_init.sql — Core schema (profiles, content, progress, gamification)
-- =========================================================================

create extension if not exists "pgcrypto";

-- ----- profiles (extends auth.users) -------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  mascot_outfit   text not null default 'classic',
  current_league  text not null default 'bronze',
  role            text not null default 'student' check (role in ('student','admin')),
  daily_goal_xp   int  not null default 30 check (daily_goal_xp between 10 and 200),
  created_at      timestamptz not null default now()
);

-- ----- content: subjects / units / lessons / questions -------------------
create table public.subjects (
  id          smallserial primary key,
  slug        text unique not null,
  name        text not null,
  color       text not null,
  icon        text not null,
  order_index smallint not null,
  weight_pct  smallint not null default 20
);

create table public.units (
  id          serial primary key,
  subject_id  smallint not null references public.subjects(id) on delete cascade,
  slug        text not null,
  title       text not null,
  order_index smallint not null,
  unique (subject_id, slug)
);

create table public.lessons (
  id          serial primary key,
  unit_id     int not null references public.units(id) on delete cascade,
  subject_id  smallint not null references public.subjects(id) on delete cascade,
  slug        text not null,
  title       text not null,
  theory_md   text,
  xp_reward   int not null default 10,
  order_index smallint not null,
  unique (unit_id, slug)
);

create table public.questions (
  id              bigserial primary key,
  subject_id      smallint not null references public.subjects(id) on delete cascade,
  lesson_id       int references public.lessons(id) on delete set null,
  stem            text not null,
  choice_a        text not null,
  choice_b        text not null,
  choice_c        text not null,
  choice_d        text not null,
  correct         char(1) not null check (correct in ('A','B','C','D')),
  explanation_md  text,
  difficulty      smallint not null default 2 check (difficulty between 1 and 5),
  source_ref      text
);
create index questions_subject_idx on public.questions(subject_id);
create index questions_lesson_idx  on public.questions(lesson_id);

-- ----- per-user progress / SRS / stats -----------------------------------
create table public.user_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    int  not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  best_score   int,
  attempts     int not null default 0,
  primary key (user_id, lesson_id)
);

create table public.user_question_attempts (
  id               bigserial primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  question_id      bigint not null references public.questions(id) on delete cascade,
  attempted_at     timestamptz not null default now(),
  was_correct      boolean not null,
  sm2_easiness     real not null default 2.5,
  sm2_interval     int  not null default 0,
  sm2_repetitions  int  not null default 0,
  due_at           date
);
create index uqa_user_due_idx on public.user_question_attempts(user_id, due_at);
create index uqa_user_question_idx on public.user_question_attempts(user_id, question_id);

create table public.user_stats (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  total_xp           int not null default 0,
  current_streak     int not null default 0,
  longest_streak     int not null default 0,
  last_activity_date date,
  hearts             smallint not null default 5 check (hearts between 0 and 5),
  hearts_regen_at    timestamptz,
  streak_freezes     smallint not null default 0
);

-- ----- leagues -----------------------------------------------------------
create table public.leagues (
  id        serial primary key,
  iso_week  text not null,
  division  text not null check (division in ('bronze','prata','ouro','diamante')),
  unique (iso_week, division)
);

create table public.league_members (
  league_id  int not null references public.leagues(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  weekly_xp  int not null default 0,
  primary key (league_id, user_id)
);
create index league_members_xp_idx on public.league_members(league_id, weekly_xp desc);

-- ----- badges ------------------------------------------------------------
create table public.badges (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon        text not null,
  criterion   jsonb not null  -- e.g. {"type":"streak","value":3}
);

create table public.user_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  int not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ----- mock exam ---------------------------------------------------------
create table public.mock_exam_attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  scores_by_subject  jsonb,
  total_correct      int,
  passed             boolean,
  answers            jsonb
);
create index mock_exam_user_idx on public.mock_exam_attempts(user_id, started_at desc);

-- ----- public view that hides the correct answer -----------------------
create view public.questions_public as
  select id, subject_id, lesson_id, stem, choice_a, choice_b, choice_c, choice_d, difficulty
  from public.questions;

-- ----- trigger: create profile + stats on signup ------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_stats (user_id, hearts_regen_at)
    values (new.id, now()) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
