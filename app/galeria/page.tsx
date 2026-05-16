import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { GalleryFeed } from "@/components/gallery/GalleryFeed";
import { Mascot } from "@/components/mascot/Mascot";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { createClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";

export const dynamic = "force-dynamic";

export default async function GalleryFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: stats }, { data: posts }, { data: myLikes }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("gallery_posts")
      .select(
        "id, image_url, thumbnail_url, caption, aircraft_model, location, likes_count, comments_count, created_at, user_id",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("gallery_likes").select("post_id").eq("user_id", user.id),
  ]);

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  // Hydrate poster profile + likedByMe in one pass.
  const userIds = Array.from(new Set((posts ?? []).map((p) => p.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, profile_color")
        .in("id", userIds)
    : { data: [] as Array<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null; profile_color: string }> };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

  const items = (posts ?? []).map((p) => ({
    ...p,
    poster: profileById.get(p.user_id) ?? null,
    likedByMe: likedSet.has(p.id),
  }));

  return (
    <AppShell>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={refreshed.hearts}
        gems={stats?.gems ?? 0}
      />

      <PullToRefresh className="relative">
        <main className="container max-w-2xl space-y-6 py-6">
          <header className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black dark:text-cloud">Galeria</h1>
              <p className="text-sm text-ink/60 dark:text-cloud/60">
                Fotos de aviões compartilhadas pela comunidade.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link href="/galeria/meus">
                <Button variant="outline" size="sm">
                  <Camera size={14} />
                  Meus posts
                </Button>
              </Link>
              <Link href="/galeria/novo">
                <Button size="sm">
                  <ImagePlus size={14} />
                  Postar foto
                </Button>
              </Link>
            </div>
          </header>

          {items.length === 0 ? (
            <EmptyGallery />
          ) : (
            <GalleryFeed items={items} />
          )}
        </main>
      </PullToRefresh>
    </AppShell>
  );
}

function EmptyGallery() {
  return (
    <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
      <Mascot state="thinking" size={120} />
      <div>
        <h2 className="text-lg font-black">Galeria ainda vazia</h2>
        <p className="mt-1 text-sm text-ink/60">
          Que tal você ser o primeiro a postar uma foto de avião?
        </p>
      </div>
      <Link href="/galeria/novo">
        <Button>
          <ImagePlus size={16} />
          Postar a primeira
        </Button>
      </Link>
    </div>
  );
}
