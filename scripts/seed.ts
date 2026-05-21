/* eslint-disable no-console */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Database, Json } from "@/lib/supabase/types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient<Database>(URL, KEY);

const ROOT = join(process.cwd(), "content");

type SubjectSeed = {
  slug: string;
  name: string;
  color: string;
  icon: string;
  order_index: number;
  weight_pct: number;
};
type UnitSeed = { slug: string; title: string; order_index: number };
type ExerciseKindSeed =
  | "multiple_choice"
  | "match_pairs"
  | "fill_blank"
  | "true_false"
  | "tap_tiles"
  | "theory_step";

type QuestionSeed = {
  stem: string;
  // MCQ fields — required by the schema (NOT NULL) but ignored for non-MCQ
  // kinds. Non-MCQ rows in the JSON should still set these to empty strings
  // or pick-one placeholder text; the seeder fills sensible defaults.
  choice_a?: string;
  choice_b?: string;
  choice_c?: string;
  choice_d?: string;
  correct?: "A" | "B" | "C" | "D";
  explanation_md: string;
  difficulty: number;
  source_ref?: string;
  lesson_slug?: string;
  // Polymorphic exercise fields (introduced in migration 0012).
  kind?: ExerciseKindSeed;
  payload?: Json;
};
type BadgeSeed = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  criterion: Json;
};

function readJSON<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;
}

async function seedSubjects() {
  const subjects = readJSON<SubjectSeed[]>("subjects.json");
  for (const s of subjects) {
    const { error } = await supabase.from("subjects").upsert(s, { onConflict: "slug" });
    if (error) throw error;
  }
  console.log(`✓ ${subjects.length} subjects`);
}

async function seedUnits() {
  const subjects = readJSON<SubjectSeed[]>("subjects.json");
  for (const s of subjects) {
    const units = readJSON<UnitSeed[]>(`units/${s.slug}.json`);
    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", s.slug)
      .single();
    if (!subj) throw new Error(`Subject not found: ${s.slug}`);
    for (const u of units) {
      const { error } = await supabase
        .from("units")
        .upsert({ ...u, subject_id: subj.id }, { onConflict: "subject_id,slug" });
      if (error) throw error;
    }
    console.log(`✓ ${units.length} units in ${s.slug}`);
  }
}

async function seedLessons() {
  const subjects = readJSON<SubjectSeed[]>("subjects.json");
  let total = 0;
  for (const s of subjects) {
    const subjectDir = join(ROOT, "lessons", s.slug);
    if (!existsSync(subjectDir)) continue;

    const unitDirs = readdirSync(subjectDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", s.slug)
      .single();
    if (!subj) continue;

    for (const unitSlug of unitDirs) {
      const { data: unit } = await supabase
        .from("units")
        .select("id")
        .eq("subject_id", subj.id)
        .eq("slug", unitSlug)
        .single();
      if (!unit) continue;

      const files = readdirSync(join(subjectDir, unitSlug)).filter((f) => f.endsWith(".mdx"));
      for (const f of files) {
        const raw = readFileSync(join(subjectDir, unitSlug, f), "utf8");
        const parsed = matter(raw);
        const fm = parsed.data as {
          slug: string;
          title: string;
          xp_reward?: number;
          order_index?: number;
        };
        const { error } = await supabase.from("lessons").upsert(
          {
            unit_id: unit.id,
            subject_id: subj.id,
            slug: fm.slug,
            title: fm.title,
            theory_md: parsed.content.trim(),
            xp_reward: fm.xp_reward ?? 10,
            order_index: fm.order_index ?? 1,
          },
          { onConflict: "unit_id,slug" },
        );
        if (error) throw error;
        total += 1;
      }
    }
  }
  console.log(`✓ ${total} lessons`);
}

async function seedQuestions() {
  const subjects = readJSON<SubjectSeed[]>("subjects.json");
  let total = 0;
  for (const s of subjects) {
    const path = `questions/${s.slug}.json`;
    if (!existsSync(join(ROOT, path))) continue;
    const items = readJSON<QuestionSeed[]>(path);

    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", s.slug)
      .single();
    if (!subj) continue;

    // Reset & insert (idempotent: delete by source_ref+stem hash would be safer in prod).
    for (const q of items) {
      let lessonId: number | null = null;
      if (q.lesson_slug) {
        const { data: lesson } = await supabase
          .from("lessons")
          .select("id")
          .eq("subject_id", subj.id)
          .eq("slug", q.lesson_slug)
          .maybeSingle();
        lessonId = lesson?.id ?? null;
      }

      // Use stem as a natural dedup key (subject + stem must be unique enough).
      const { data: existing } = await supabase
        .from("questions")
        .select("id")
        .eq("subject_id", subj.id)
        .eq("stem", q.stem)
        .maybeSingle();

      const kind = q.kind ?? "multiple_choice";
      // Non-MCQ rows still need values for the four NOT NULL choice columns.
      // Fill with empty strings — they're never surfaced to the player when
      // `kind` is not "multiple_choice".
      const placeholder = "";
      const payload = {
        subject_id: subj.id,
        lesson_id: lessonId,
        stem: q.stem,
        choice_a: q.choice_a ?? placeholder,
        choice_b: q.choice_b ?? placeholder,
        choice_c: q.choice_c ?? placeholder,
        choice_d: q.choice_d ?? placeholder,
        correct: q.correct ?? "A",
        explanation_md: q.explanation_md,
        difficulty: q.difficulty,
        source_ref: q.source_ref ?? null,
        kind,
        payload: q.payload ?? null,
      };

      if (existing) {
        await supabase.from("questions").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("questions").insert(payload);
      }
      total += 1;
    }
    console.log(`✓ ${items.length} questions in ${s.slug}`);
  }
  console.log(`✓ ${total} questions total`);
}

async function seedBadges() {
  const badges = readJSON<BadgeSeed[]>("badges.json");
  for (const b of badges) {
    const { error } = await supabase.from("badges").upsert(b, { onConflict: "slug" });
    if (error) throw error;
  }
  console.log(`✓ ${badges.length} badges`);
}

async function main() {
  console.log("Seeding Supabase...");
  await seedSubjects();
  await seedUnits();
  await seedLessons();
  await seedQuestions();
  await seedBadges();
  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
