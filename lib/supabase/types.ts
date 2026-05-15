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
        // 0006_social additions
        display_name: string | null;
        bio: string | null;
        country_code: string | null;
        profile_color: string;
        profile_public: boolean;
        joined_at: string;
        // 0008_outfits
        equipped_outfit_slug: string | null;
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
        kind:
          | "multiple_choice"
          | "match_pairs"
          | "fill_blank"
          | "true_false"
          | "tap_tiles"
          | "theory_step";
        payload: Json | null;
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
        hearts_unlimited_until: string | null;
        pro_until: string | null;
        pro_plan: string | null;
        // 0008_outfits
        gems: number;
        last_spin_at: string | null;
        last_jackpot_at: string | null;
      }>;
      subscriptions: Tbl<{
        id: number;
        user_id: string;
        provider: "stripe" | "apple_iap" | "google_iap";
        provider_ref: string;
        product_sku: string;
        status: "trialing" | "active" | "past_due" | "canceled" | "expired";
        current_period_end: string | null;
        cancel_at: string | null;
        trial_end: string | null;
        created_at: string;
        updated_at: string;
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
      products: Tbl<{
        id: number;
        sku: string;
        name: string;
        description: string | null;
        kind:
          | "hearts_refill"
          | "hearts_unlimited"
          | "streak_freezes"
          | "remove_ads"
          | "donation"
          | "pro_subscription"
          | "pro_lifetime"
          | "mascot_outfit";
        payload: Json;
        price_cents: number;
        currency: string;
        active: boolean;
        order_index: number;
      }>;
      purchases: Tbl<{
        id: number;
        user_id: string;
        product_id: number;
        amount_cents: number;
        currency: string;
        provider: "stripe" | "apple_iap" | "google_iap";
        provider_ref: string;
        payment_method: string | null;
        status: "pending" | "paid" | "failed" | "refunded";
        fulfilled_at: string | null;
        fulfilled_payload: Json | null;
        created_at: string;
        updated_at: string;
      }>;
      // 0006_social
      follows: Tbl<{
        follower_id: string;
        followed_id: string;
        created_at: string;
      }>;
      // 0010_notifications
      notifications: Tbl<{
        id: number;
        user_id: string;
        kind: "followed_you" | "outfit_unlocked" | "league_promoted";
        payload: Json;
        read_at: string | null;
        created_at: string;
      }>;
      // 0008_outfits
      mascot_outfits: Tbl<{
        slug: string;
        name: string;
        description: string | null;
        tier: "free" | "prize" | "paid";
        rarity: "common" | "rare" | "epic" | "legendary";
        price_gems: number | null;
        price_cents: number | null;
        stripe_price_id: string | null;
        asset_key: string;
        drop_weight: number;
        created_at: string;
      }>;
      push_tokens: Tbl<{
        id: number;
        user_id: string;
        token: string;
        platform: "ios" | "android" | "web";
        device_label: string | null;
        created_at: string;
        last_seen_at: string;
        revoked_at: string | null;
      }>;
      user_outfits: Tbl<{
        user_id: string;
        outfit_slug: string;
        acquired_via:
          | "starter"
          | "roulette"
          | "jackpot"
          | "league_reward"
          | "purchase"
          | "pro_unlock";
        acquired_at: string;
      }>;
      user_activities: Tbl<{
        id: number;
        user_id: string;
        kind:
          | "lesson_completed"
          | "badge_earned"
          | "league_promoted"
          | "exam_passed"
          | "streak_milestone"
          | "outfit_unlocked"
          | "jackpot_win";
        payload: Json;
        created_at: string;
      }>;
    };
    Views: {
      questions_public: View<{
        id: number;
        subject_id: number;
        lesson_id: number | null;
        stem: string;
        kind:
          | "multiple_choice"
          | "match_pairs"
          | "fill_blank"
          | "true_false"
          | "tap_tiles"
          | "theory_step";
        payload: Json | null;
        choice_a: string;
        choice_b: string;
        choice_c: string;
        choice_d: string;
        difficulty: number;
      }>;
      public_activities_v: View<{
        id: number;
        user_id: string;
        kind: string;
        payload: Json;
        created_at: string;
      }>;
    };
    Functions: {
      find_user_id_by_email: {
        Args: { p_email: string };
        Returns: string;
      };
    };
  };
};
