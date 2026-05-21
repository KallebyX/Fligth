import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Camera } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ModerationRow } from "@/components/gallery/ModerationRow";

export const dynamic = "force-dynamic";

export default async function GalleryModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: pending }, { count: approvedCount }, { count: rejectedCount }] = await Promise.all([
    supabase
      .from("gallery_posts")
      .select("id, image_url, thumbnail_url, caption, aircraft_model, location, user_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(40),
    supabase.from("gallery_posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("gallery_posts").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  const userIds = Array.from(new Set((pending ?? []).map((p) => p.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds)
    : { data: [] as Array<{ id: string; username: string | null; display_name: string | null }> };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <main className="container max-w-3xl space-y-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar ao admin
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black">
          <Camera size={26} className="text-sky" />
          Moderação da galeria
        </h1>
        <p className="text-sm text-ink/60">
          Aprove ou rejeite as fotos pendentes. Aprovadas ficam visíveis no
          feed público.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pendentes" value={pending?.length ?? 0} tint="bg-sun/15 text-sun" />
        <Stat label="Aprovadas" value={approvedCount ?? 0} tint="bg-grass/15 text-grass-deep" />
        <Stat label="Rejeitadas" value={rejectedCount ?? 0} tint="bg-alert/15 text-alert" />
      </div>

      {!pending || pending.length === 0 ? (
        <Card className="text-center">
          <CardTitle>Fila vazia</CardTitle>
          <CardDesc className="mt-2">
            Nenhuma foto aguardando moderação no momento.
          </CardDesc>
        </Card>
      ) : (
        <ul className="space-y-3">
          {pending.map((p) => {
            const poster = profileById.get(p.user_id);
            return (
              <li key={p.id}>
                <ModerationRow
                  postId={p.id}
                  imageUrl={p.image_url}
                  thumbnailUrl={p.thumbnail_url}
                  caption={p.caption}
                  aircraftModel={p.aircraft_model}
                  location={p.location}
                  posterUsername={poster?.username ?? null}
                  posterDisplayName={poster?.display_name ?? null}
                  createdAt={p.created_at}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="card-pop flex flex-col items-start gap-1 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <p className={`rounded-full px-2 py-0.5 text-lg font-black tabular-nums ${tint}`}>
        {value}
      </p>
    </div>
  );
}
