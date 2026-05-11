import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HUD } from "@/components/hud/HUD";
import { computeHearts } from "@/lib/hearts";
import { computeProStatus } from "@/lib/pro";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp, current_streak, hearts, hearts_regen_at, pro_until, pro_plan")
    .eq("user_id", user.id)
    .single();

  // Compute on read so the HUD always reflects regenerated hearts.
  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  if (stats && refreshed.changed) {
    await supabase
      .from("user_stats")
      .update({ hearts: refreshed.hearts, hearts_regen_at: refreshed.hearts_regen_at })
      .eq("user_id", user.id);
  }

  const pro = computeProStatus(stats?.pro_until ?? null, stats?.pro_plan ?? null);

  return (
    <>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={refreshed.hearts}
        isPro={pro.isPro}
      />
      {children}
    </>
  );
}
