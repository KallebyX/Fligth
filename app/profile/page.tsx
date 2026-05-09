import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/server";
import { Award, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: stats }, { data: badges }, { data: exams }] = await Promise.all([
    supabase.from("profiles").select("username, current_league, daily_goal_xp").eq("id", user.id).single(),
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, longest_streak")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("earned_at, badges(slug, name, description, icon)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
    supabase
      .from("mock_exam_attempts")
      .select("id, finished_at, total_correct, passed")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <main className="container max-w-3xl space-y-8 py-8">
      <header className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
        <Mascot state="happy" size={120} />
        <div>
          <h1 className="text-3xl font-black">{profile?.username ?? "Piloto"}</h1>
          <p className="text-sm uppercase tracking-wide text-ink/60">
            Liga {profile?.current_league ?? "bronze"} · Meta {profile?.daily_goal_xp ?? 30} XP/dia
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Star className="text-gold" />} label="XP total" value={stats?.total_xp ?? 0} />
        <StatCard
          icon={<Flame className="text-sun" />}
          label="Ofensiva"
          value={`${stats?.current_streak ?? 0} dias`}
        />
        <StatCard
          icon={<Award className="text-grass" />}
          label="Maior ofensiva"
          value={`${stats?.longest_streak ?? 0} dias`}
        />
      </div>

      <Card>
        <CardTitle>Conquistas</CardTitle>
        <CardDesc>{badges?.length ?? 0} de muitas...</CardDesc>
        {!badges || badges.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">Complete sua primeira lição para desbloquear conquistas!</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b) => {
              const badge = (b as unknown as { badges: { slug: string; name: string; description: string; icon: string } }).badges;
              return (
                <div key={badge.slug} className="rounded-2xl border-2 border-cloud-deep bg-white p-3 text-center">
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Award size={24} />
                  </div>
                  <p className="text-sm font-extrabold">{badge.name}</p>
                  <p className="text-xs text-ink/60">{badge.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Histórico de simulados</CardTitle>
        {!exams || exams.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Você ainda não fez nenhum simulado.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cloud-deep/30">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span className="text-sm">
                  {e.finished_at ? new Date(e.finished_at).toLocaleString("pt-BR") : "—"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-0.5 text-xs font-extrabold",
                    e.passed ? "bg-grass/20 text-grass-deep" : "bg-alert/20 text-alert",
                  )}
                >
                  {e.total_correct}/100 · {e.passed ? "Aprovado" : "Não aprovado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-3">
        <Link href="/learn">
          <Button variant="outline">Voltar às trilhas</Button>
        </Link>
        <form
          action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect("/");
          }}
        >
          <Button type="submit" variant="ghost">Sair</Button>
        </form>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card-pop p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-xs uppercase tracking-wide text-ink/60">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
