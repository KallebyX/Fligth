import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonPath, type LessonNode } from "@/components/learn/LessonPath";
import { Button } from "@/components/ui/button";

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

  // Load subjects + units + lessons + this user's progress.
  const [{ data: subjects }, { data: units }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("subjects").select("id, slug, name, color, icon, order_index").order("order_index"),
    supabase.from("units").select("id, subject_id, slug, title, order_index").order("order_index"),
    supabase
      .from("lessons")
      .select("id, unit_id, subject_id, slug, title, order_index")
      .order("order_index"),
    supabase.from("user_progress").select("lesson_id, completed_at").eq("user_id", user.id),
  ]);

  const completedSet = new Set(
    (progress ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
  );

  return (
    <main className="container py-6 pb-24">
      {params.out === "hearts" && (
        <div className="mb-6 rounded-2xl border-2 border-alert bg-alert/10 p-4 text-center">
          <p className="text-sm font-bold text-alert">
            Você ficou sem vidas. As vidas regeneram automaticamente — volte em 30 minutos.
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Suas trilhas</h1>
          <p className="text-sm text-ink/60">5 matérias da prova teórica de Piloto Privado.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/review">
            <Button variant="outline" size="sm">
              Revisão (SRS)
            </Button>
          </Link>
          <Link href="/exam">
            <Button variant="warn" size="sm">
              Simulado completo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-3">
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
  );
}
