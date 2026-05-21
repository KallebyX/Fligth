import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { UploadForm } from "@/components/gallery/UploadForm";
import { createClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";

export const dynamic = "force-dynamic";

export default async function NewGalleryPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
    .eq("user_id", user.id)
    .single();

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

      <main className="container max-w-xl space-y-6 py-6">
        <Link
          href="/galeria"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
        >
          <ChevronLeft size={16} />
          Voltar à galeria
        </Link>

        <header>
          <h1 className="text-3xl font-black">Postar foto</h1>
          <p className="text-sm text-ink/60">
            Sua foto vai passar por moderação antes de aparecer no feed
            público. Geralmente leva menos de 24h.
          </p>
        </header>

        <Card>
          <CardTitle>Regras rápidas</CardTitle>
          <CardDesc>
            • Fotos de aviões, aeroportos, vista de cockpit. <br />
            • Sem nudez, violência, ofensas ou propaganda. <br />
            • Sem fotos roubadas de outros sites. <br />
            • Máximo 3 uploads por dia. <br />
            Quem viola as regras tem upload bloqueado.
          </CardDesc>
        </Card>

        <UploadForm userId={user.id} />
      </main>
    </AppShell>
  );
}
