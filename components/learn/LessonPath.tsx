import Link from "next/link";
import { Lock, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type LessonNode = {
  id: number;
  slug: string;
  title: string;
  unitTitle: string;
  state: "locked" | "available" | "done";
};

export function LessonPath({
  subjectSlug,
  subjectName,
  subjectColor,
  nodes,
}: {
  subjectSlug: string;
  subjectName: string;
  subjectColor: string;
  nodes: LessonNode[];
}) {
  return (
    <section className="mx-auto w-full max-w-md py-8">
      <div
        className="mb-6 rounded-2xl px-4 py-3 text-white shadow-pop"
        style={{ backgroundColor: subjectColor }}
      >
        <span className="text-xs uppercase tracking-wide opacity-80">Trilha</span>
        <h2 className="text-xl font-extrabold">{subjectName}</h2>
      </div>

      <ol className="relative flex flex-col items-center gap-8">
        {nodes.map((n, i) => {
          // Serpentine: alternate slight horizontal offset
          const offset = i % 4 === 0 ? 0 : i % 4 === 1 ? 56 : i % 4 === 2 ? 80 : 56;
          const dir = Math.floor(i / 4) % 2 === 0 ? 1 : -1;

          return (
            <li
              key={n.id}
              className="relative"
              style={{ transform: `translateX(${dir * offset}px)` }}
            >
              <p className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-ink/50">
                {n.unitTitle}
              </p>

              {n.state === "locked" ? (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-cloud-deep bg-cloud opacity-60"
                  aria-label={`${n.title} (bloqueado)`}
                >
                  <Lock size={28} className="text-ink/40" />
                </div>
              ) : (
                <Link
                  href={`/learn/${subjectSlug}/${n.slug}`}
                  className={cn(
                    "group relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-transform active:translate-y-1 shadow-pop",
                    n.state === "done"
                      ? "border-grass-deep bg-grass text-white"
                      : "border-sky-deep bg-sky text-white hover:scale-105",
                  )}
                  aria-label={n.title}
                >
                  {n.state === "done" ? <Check size={32} /> : <Star size={32} />}
                  <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-0.5 text-xs font-extrabold shadow-pop">
                    {n.title}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
