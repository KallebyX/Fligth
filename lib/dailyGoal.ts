import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

type DB = SupabaseClient<Database, "public">;

// Soma de XP que o usuário ganhou hoje a partir de lesson_completed
// activities. Usado pelo DailyGoalRing no HUD.
export async function getTodayXP(supabase: DB, userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("user_activities")
    .select("payload")
    .eq("user_id", userId)
    .eq("kind", "lesson_completed")
    .gte("created_at", startOfDay.toISOString())
    .limit(50);

  let total = 0;
  for (const row of data ?? []) {
    const payload = row.payload as Json;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const xp = (payload as Record<string, unknown>).xp;
      if (typeof xp === "number") total += xp;
    }
  }
  return total;
}
