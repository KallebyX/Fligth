-- =========================================================================
-- 0012_exercise_types.sql — Polymorphic exercises (Duolingo-style)
-- =========================================================================
-- Adds `kind` + `payload` to public.questions so a single row can represent
-- match-pairs, fill-blank, true/false, tap-tiles or a theory-step in
-- addition to the original multiple-choice. The `questions_public` view is
-- recreated to surface the new columns to authenticated clients without
-- exposing the correct answer for `multiple_choice`.

alter table public.questions
  add column if not exists kind text not null default 'multiple_choice'
    check (kind in (
      'multiple_choice',
      'match_pairs',
      'fill_blank',
      'true_false',
      'tap_tiles',
      'theory_step'
    )),
  add column if not exists payload jsonb;

-- Existing rows are all multiple_choice. The DEFAULT above already covers
-- new inserts; this just normalises any legacy NULLs that pre-existed the
-- NOT NULL constraint.
update public.questions
  set kind = 'multiple_choice'
  where kind is null;

create index if not exists questions_kind_idx on public.questions(kind);

-- ----- Recreate the public view to include the new columns ---------------
-- The view never exposes `correct`. For non-MCQ kinds, the answer lives in
-- `payload`, which the server stores in such a way that the client sees a
-- safe projection only (see lib/exercises/* validators on the server).
drop view if exists public.questions_public;
create view public.questions_public as
  select
    id,
    subject_id,
    lesson_id,
    stem,
    kind,
    payload,
    choice_a,
    choice_b,
    choice_c,
    choice_d,
    difficulty
  from public.questions;

grant select on public.questions_public to anon, authenticated;
