import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, CheckCircle2, XCircle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { createClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; Icon: typeof Clock; cls: string }> = {
  pending:  { label: "Em moderação", Icon: Clock,         cls: "bg-sun/15 text-sun" },
  approved: { label: "Aprovada",     Icon: CheckCircle2,  cls: "bg-grass/15 text-grass-deep" },
  rejected: { label: "Rejeitada",    Icon: XCircle,       cls: "bg-alert/15 text-alert" },
};

export default async function MyGalleryPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: stats }, { data: posts }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("gallery_posts")
      .select(
        "id, thumbnail_url, caption, aircraft_model, status, rejection_reason, likes_count, comments_count, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  return (
    <AppShell>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={refreshed.hearts}
        gems={stats?.gems ?? 0}
      />

      <main className="container max-w-2xl space-y-6 py-6">
        <Link
          href="/galeria"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
        >
          <ChevronLeft size={16} />
          Voltar à galeria
        </Link>

        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Meus posts</h1>
            <p className="text-sm text-ink/60">
              Fotos que você enviou e o status de cada uma.
            </p>
          </div>
          <Link href="/galeria/novo">
            <Button size="sm">
              <ImagePlus size={14} />
              Nova foto
            </Button>
          </Link>
        </header>

        {!posts || posts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-cloud-deep bg-white/60 p-10 text-center">
            <p className="text-sm text-ink/60">Você ainda não postou nenhuma foto.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => {
              const meta = STATUS_META[p.status] ?? STATUS_META.pending;
              const Icon = meta.Icon;
              return (
                <li
                  key={p.id}
                  className="flex items-stretch gap-3 rounded-2xl border-2 border-cloud-deep bg-white p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnail_url}
                    alt={p.caption ?? "Post"}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                          meta.cls,
                        )}
                      >
                        <Icon size={11} />
                        {meta.label}
                      </span>
                      {p.aircraft_model && (
                        <span className="rounded-full bg-cloud px-2 py-0.5 text-[11px] font-bold text-ink/70">
                          {p.aircraft_model}
                        </span>
                      )}
                    </div>
                    {p.caption && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink/80">
                        {p.caption}
                      </p>
                    )}
                    {p.status === "rejected" && p.rejection_reason && (
                      <p className="mt-1 rounded-xl bg-alert/5 px-2 py-1 text-xs text-alert">
                        Motivo: {p.rejection_reason}
                      </p>
                    )}
                    {p.status === "approved" && (
                      <p className="mt-1 text-xs text-ink/50">
                        ❤️ {p.likes_count} · 💬 {p.comments_count}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
