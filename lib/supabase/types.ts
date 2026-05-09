// Hand-written for the MVP. After provisioning Supabase, regenerate with:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

// Insert/Update are Partial because:
//  - Postgres-managed defaults (id, created_at, computed columns) are optional.
//  - Strict typing for required-on-insert is not worth the friction at MVP scale.
type Tbl<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type View<Row extends Record<string, unknown>> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<{
        id: string;
        username: string | null;
        mascot_outfit: string;
        current_league: string;
        role: string;
        daily_goal_xp: number;
        created_at: string;
      }>;
      subjects: Tbl<{
        id: number;
        slug: string;
        name: string;
        color: string;
        icon: string;
        order_index: number;
        weight_pct: number;
      }>;
      units: Tbl<{
        id: number;
        subject_id: number;
        slug: string;
        title: string;
        order_index: number;
      }>;
      lessons: Tbl<{
        id: number;
        unit_id: number;
        subject_id: number;
        slug: string;
        title: string;
        theory_md: string | null;
        xp_reward: number;
        order_index: number;
      }>;
      questions: Tbl<{
        id: number;
        subject_id: number;
        lesson_id: number | null;
        stem: string;
        choice_a: string;
        choice_b: string;
        choice_c: string;
        choice_d: string;
        correct: "A" | "B" | "C" | "D";
        explanation_md: string | null;
        difficulty: number;
        source_ref: string | null;
      }>;
      user_progress: Tbl<{
        user_id: string;
        lesson_id: number;
        completed_at: string | null;
        best_score: number | null;
        attempts: number;
      }>;
      user_question_attempts: Tbl<{
        id: number;
        user_id: string;
        question_id: number;
        attempted_at: string;
        was_correct: boolean;
        sm2_easiness: number;
        sm2_interval: number;
        sm2_repetitions: number;
        due_at: string | null;
      }>;
      user_stats: Tbl<{
        user_id: string;
        total_xp: number;
        current_streak: number;
        longest_streak: number;
        last_activity_date: string | null;
        hearts: number;
        hearts_regen_at: string | null;
        streak_freezes: number;
      }>;
      leagues: Tbl<{ id: number; iso_week: string; division: string }>;
      league_members: Tbl<{ league_id: number; user_id: string; weekly_xp: number }>;
      badges: Tbl<{
        id: number;
        slug: string;
        name: string;
        description: string;
        icon: string;
        criterion: Json;
      }>;
      user_badges: Tbl<{ user_id: string; badge_id: number; earned_at: string }>;
      mock_exam_attempts: Tbl<{
        id: string;
        user_id: string;
        started_at: string;
        finished_at: string | null;
        scores_by_subject: Json | null;
        total_correct: number | null;
        passed: boolean | null;
        answers: Json | null;
      }>;
    };
    Views: {
      questions_public: View<{
        id: number;
        subject_id: number;
        lesson_id: number | null;
        stem: string;
        choice_a: string;
        choice_b: string;
        choice_c: string;
        choice_d: string;
        difficulty: number;
      }>;
    };
    Functions: Record<string, never>;
  };
};
