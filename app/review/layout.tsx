// Reuses the /learn HUD by rendering it through the same shape.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HUD } from "@/components/hud/HUD";
import { computeHearts } from "@/lib/hearts";

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp, current_streak, hearts, hearts_regen_at")
    .eq("user_id", user.id)
    .single();

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  return (
    <>
      <HUD xp={stats?.total_xp ?? 0} streak={stats?.current_streak ?? 0} hearts={refreshed.hearts} />
      {children}
    </>
  );
}
