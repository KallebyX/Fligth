import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonPath, type LessonNode } from "@/components/learn/LessonPath";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { HUD } from "@/components/hud/HUD";
import { getDivision } from "@/lib/leagues/divisions";
import { computeHearts } from "@/lib/hearts";
import { computeProStatus } from "@/lib/pro";
import { getTodayXP } from "@/lib/dailyGoal";
import { Flame, Trophy, RotateCw, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ out?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // Load content + this user's progress + the home hero data.
  const [
    { data: subjects },
    { data: units },
    { data: lessons },
    { data: progress },
    { data: profile },
    { data: stats },
  ] = await Promise.all([
    supabase.from("subjects").select("id, slug, name, color, icon, order_index").order("order_index"),
    supabase.from("units").select("id, subject_id, slug, title, order_index").order("order_index"),
    supabase
      .from("lessons")
      .select("id, unit_id, subject_id, slug, title, order_index")
      .order("order_index"),
    supabase.from("user_progress").select("lesson_id, completed_at").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("username, display_name, current_league, equipped_outfit_slug, daily_goal_xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, hearts, hearts_regen_at, pro_until, pro_plan, gems")
      .eq("user_id", user.id)
      .single(),
  ]);

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
  const todayXp = await getTodayXP(supabase, user.id);
  const goalXp = profile?.daily_goal_xp ?? 20;

  const completedSet = new Set(
    (progress ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
  );

  const division = getDivision(profile?.current_league ?? "bronze");
  const friendlyName = profile?.display_name ?? profile?.username ?? "piloto";
  const streak = stats?.current_streak ?? 0;

  return (
    <>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={refreshed.hearts}
        gems={stats?.gems ?? 0}
        isPro={pro.isPro}
        todayXp={todayXp}
        goalXp={goalXp}
      />
      <main className="container max-w-3xl py-6">
      {params.out === "hearts" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-alert bg-alert/10 p-4">
          <p className="text-sm font-bold text-alert">
            Você ficou sem vidas — recupera 1 a cada 30 min.
          </p>
          <Link href="/shop">
            <Button size="sm" variant="danger">
              Recarregar agora
            </Button>
          </Link>
        </div>
      )}

      <section className="card-pop relative mb-6 overflow-hidden p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0">
            <Mascot state="happy" size={88} outfit={profile?.equipped_outfit_slug} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
              Oi, capitão
            </p>
            <h1 className="truncate text-xl font-black md:text-2xl">
              {friendlyName}, pronto pra voar?
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link
                href="/leagues"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-pop ring-1 ring-cloud-deep/40 hover:-translate-y-0.5 transition-transform"
                style={{ color: division.color }}
              >
                <Trophy size={14} />
                {division.name}
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-sun">
                <Flame size={14} />
                {streak} dia{streak === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/review" className="flex-1 min-w-[140px]">
            <Button variant="outline" size="md" className="w-full justify-start">
              <RotateCw size={16} />
              Revisão diária
            </Button>
          </Link>
          <Link href="/exam" className="flex-1 min-w-[140px]">
            <Button variant="warn" size="md" className="w-full justify-start">
              <ClipboardCheck size={16} />
              Simulado 100q
            </Button>
          </Link>
        </div>
      </section>

      <div className="mb-6 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-black md:text-2xl">Suas trilhas</h2>
          <p className="text-sm text-ink/60">
            5 matérias da prova teórica de Piloto Privado.
          </p>
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {(subjects ?? []).map((subject) => {
          const subjectUnits = (units ?? []).filter((u) => u.subject_id === subject.id);
          const subjectLessons = (lessons ?? []).filter((l) => l.subject_id === subject.id);

          let firstAvailableHit = false;
          const nodes: LessonNode[] = subjectLessons.map((l) => {
            const unit = subjectUnits.find((u) => u.id === l.unit_id);
            const completed = completedSet.has(l.id);
            let state: LessonNode["state"];
            if (completed) state = "done";
            else if (!firstAvailableHit) {
              state = "available";
              firstAvailableHit = true;
            } else state = "locked";
            return {
              id: l.id,
              slug: l.slug,
              title: l.title,
              unitTitle: unit?.title ?? "",
              state,
            };
          });

          // If everything is done, leave nothing 'available' — encourages reviews.
          return (
            <LessonPath
              key={subject.id}
              subjectSlug={subject.slug}
              subjectName={subject.name}
              subjectColor={subject.color}
              subjectIcon={subject.icon}
              nodes={nodes}
            />
          );
        })}
      </div>
      </main>
    </>
  );
}
