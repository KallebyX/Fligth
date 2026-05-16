import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Bell,
  Volume2,
  Eye,
  Languages,
  User,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { NotificationPrefsSection } from "@/components/profile/NotificationPrefsSection";
import { SoundHapticToggles } from "@/components/settings/SoundHapticToggles";
import { SoundMixerSection } from "@/components/settings/SoundMixerSection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { computeHearts } from "@/lib/hearts";
import { getNotificationPrefs } from "@/app/actions/notificationPrefs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: stats }, notifPrefs] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, profile_public")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
      .eq("user_id", user.id)
      .single(),
    getNotificationPrefs(),
  ]);

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

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
          href="/profile"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>

        <header>
          <h1 className="text-3xl font-black">Configurações</h1>
          <p className="text-sm text-ink/60">
            Ajuste notificações, som, privacidade e idioma.
          </p>
        </header>

        <SectionHeader
          icon={<Bell size={18} />}
          title="Notificações"
          description="Push e email — controle o que chega até você."
        />
        <NotificationPrefsSection initial={notifPrefs} />

        <SectionHeader
          icon={<Volume2 size={18} />}
          title="Som & vibração"
          description="Mixer e atalhos. Vale só pra este dispositivo."
        />
        <Card>
          <SoundHapticToggles />
        </Card>
        <SoundMixerSection />

        <SectionHeader
          icon={<Eye size={18} />}
          title="Privacidade"
          description="Quem pode ver seu perfil, XP e ofensivas."
        />
        <PrivacySection
          initialProfilePublic={profile?.profile_public ?? true}
        />

        <SectionHeader
          icon={<Languages size={18} />}
          title="Idioma"
          description="Interface do app (lições continuam em português)."
        />
        <Card>
          <CardTitle>Idioma do app</CardTitle>
          <CardDesc>
            Suporte a Inglês e Espanhol vem em breve. Por enquanto, só PT-BR.
          </CardDesc>
          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border-2 border-sky/30 bg-sky/5 px-3 py-2 text-sm font-extrabold text-sky-deep">
            🇧🇷 Português (Brasil)
          </div>
        </Card>

        <SectionHeader
          icon={<User size={18} />}
          title="Conta"
          description="Perfil, segurança e dados pessoais."
        />
        <Card>
          <CardTitle>Editar perfil</CardTitle>
          <CardDesc>
            Foto, username, bio, país, outfit, email, senha e mais.
          </CardDesc>
          <div className="mt-3">
            <Link href="/profile/edit">
              <Button variant="outline">Abrir editor de perfil</Button>
            </Link>
          </div>
        </Card>

        <SectionHeader
          icon={<Info size={18} />}
          title="Sobre"
          description="Versão, termos e suporte."
        />
        <Card>
          <ul className="divide-y divide-cloud-deep/30 text-sm">
            <li className="flex items-center justify-between py-2.5">
              <span className="font-extrabold text-ink">Versão</span>
              <span className="font-mono text-xs text-ink/60">{appVersion}</span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/terms" className="font-extrabold text-ink hover:text-sky">
                Termos de uso
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40" />
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/privacy" className="font-extrabold text-ink hover:text-sky">
                Política de privacidade
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40" />
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/support" className="font-extrabold text-ink hover:text-sky">
                Suporte
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40" />
            </li>
          </ul>
        </Card>
      </main>
    </AppShell>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2 pt-2">
      <span className="mt-0.5 text-ink/60">{icon}</span>
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-ink/65">
          {title}
        </h2>
        <p className="text-xs text-ink/50">{description}</p>
      </div>
    </div>
  );
}
