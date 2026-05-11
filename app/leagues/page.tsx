import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { isoWeek, cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const DIVISION_COLOR: Record<string, string> = {
  bronze: "#92400E",
  prata: "#64748B",
  ouro: "#F59E0B",
  diamante: "#06B6D4",
};

export default async function LeaguesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_league, username")
    .eq("id", user.id)
    .single();

  const division = profile?.current_league ?? "bronze";
  const week = isoWeek();

  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("iso_week", week)
    .eq("division", division)
    .maybeSingle();

  let board: { user_id: string; weekly_xp: number; username: string | null }[] = [];

  if (league) {
    const { data: members } = await supabase
      .from("league_members")
      .select("user_id, weekly_xp")
      .eq("league_id", league.id)
      .order("weekly_xp", { ascending: false })
      .limit(30);

    const ids = (members ?? []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);
    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

    board = (members ?? []).map((m) => ({
      user_id: m.user_id,
      weekly_xp: m.weekly_xp,
      username: nameMap.get(m.user_id) ?? null,
    }));
  }

  return (
    <main className="container max-w-2xl py-8">
      <div
        className="mb-6 rounded-2xl px-5 py-4 text-white shadow-pop"
        style={{ backgroundColor: DIVISION_COLOR[division] ?? "#0EA5E9" }}
      >
        <div className="flex items-center gap-3">
          <Trophy size={28} />
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Sua liga</p>
            <h1 className="text-2xl font-black capitalize">{division}</h1>
            <p className="text-xs opacity-80">Semana {week}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardTitle>Ranking semanal</CardTitle>
        <CardDesc>Top 10 sobem para a próxima divisão · Bottom 5 descem.</CardDesc>

        {board.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">
            Ninguém na sua liga ainda essa semana. Comece uma lição e seja o primeiro!
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-cloud-deep/30">
            {board.map((m, i) => {
              const me = m.user_id === user.id;
              const promoZone = i < 10;
              const demoZone = i >= board.length - 5 && board.length > 15;
              return (
                <li
                  key={m.user_id}
                  className={cn(
                    "flex items-center justify-between py-3",
                    me && "rounded-2xl bg-sky/10 px-3",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold",
                        promoZone
                          ? "bg-grass text-white"
                          : demoZone
                            ? "bg-alert text-white"
                            : "bg-cloud text-ink/70",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="font-bold">
                      {m.username ?? "Piloto Anônimo"} {me && <span className="text-sky">(você)</span>}
                    </span>
                  </div>
                  <span className="font-extrabold text-gold">{m.weekly_xp} XP</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </main>
  );
}
