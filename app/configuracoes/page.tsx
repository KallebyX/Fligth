import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ChevronLeft,
  Bell,
  Volume2,
  Eye,
  Languages,
  User,
  Info,
  Camera,
  Building2,
  Palette,
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
import { ThemePicker } from "@/components/settings/ThemePicker";
import { LanguagePicker } from "@/components/settings/LanguagePicker";
import { computeHearts } from "@/lib/hearts";
import { getNotificationPrefs } from "@/app/actions/notificationPrefs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

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
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink dark:text-cloud/60 dark:hover:text-cloud"
        >
          <ChevronLeft size={16} />
          {tCommon("back")}
        </Link>

        <header>
          <h1 className="text-3xl font-black dark:text-cloud">{t("title")}</h1>
          <p className="text-sm text-ink/60 dark:text-cloud/60">
            {t("subtitle")}
          </p>
        </header>

        <SectionHeader
          icon={<Bell size={18} />}
          title={t("section.notifications")}
          description={t("section.notificationsDesc")}
        />
        <NotificationPrefsSection initial={notifPrefs} />

        <SectionHeader
          icon={<Volume2 size={18} />}
          title={t("section.sound")}
          description={t("section.soundDesc")}
        />
        <Card>
          <SoundHapticToggles />
        </Card>
        <SoundMixerSection />

        <SectionHeader
          icon={<Eye size={18} />}
          title={t("section.privacy")}
          description={t("section.privacyDesc")}
        />
        <PrivacySection
          initialProfilePublic={profile?.profile_public ?? true}
        />

        <SectionHeader
          icon={<Palette size={18} />}
          title={t("section.appearance")}
          description={t("section.appearanceDesc")}
        />
        <Card>
          <CardTitle>{t("theme.title")}</CardTitle>
          <CardDesc>{t("theme.description")}</CardDesc>
          <div className="mt-4">
            <ThemePicker />
          </div>
        </Card>

        <SectionHeader
          icon={<Languages size={18} />}
          title={t("section.language")}
          description={t("section.languageDesc")}
        />
        <Card>
          <CardTitle>{t("language.current")}</CardTitle>
          <div className="mt-4">
            <LanguagePicker />
          </div>
        </Card>

        <SectionHeader
          icon={<User size={18} />}
          title={t("section.account")}
          description={t("section.accountDesc")}
        />
        <Card>
          <CardTitle>Editar perfil</CardTitle>
          <CardDesc>
            Foto, username, bio, país, outfit, email, senha e mais.
          </CardDesc>
          <div className="mt-3">
            <Link href="/profile/edit">
              <Button variant="outline">{tCommon("edit")}</Button>
            </Link>
          </div>
        </Card>

        <SectionHeader
          icon={<Camera size={18} />}
          title={t("section.explore")}
          description={t("section.exploreDesc")}
        />
        <Card>
          <ul className="divide-y divide-cloud-deep/30 text-sm dark:divide-ink-light/60">
            <li className="flex items-center justify-between py-2.5">
              <Link href="/galeria" className="flex items-center gap-2 font-extrabold text-ink hover:text-sky dark:text-cloud">
                <Camera size={14} className="text-ink/60 dark:text-cloud/60" />
                Galeria
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40 dark:text-cloud/40" />
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/escolas" className="flex items-center gap-2 font-extrabold text-ink hover:text-sky dark:text-cloud">
                <Building2 size={14} className="text-ink/60 dark:text-cloud/60" />
                Escolas
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40 dark:text-cloud/40" />
            </li>
          </ul>
        </Card>

        <SectionHeader
          icon={<Info size={18} />}
          title={t("section.about")}
          description={t("section.aboutDesc")}
        />
        <Card>
          <ul className="divide-y divide-cloud-deep/30 text-sm dark:divide-ink-light/60">
            <li className="flex items-center justify-between py-2.5">
              <span className="font-extrabold text-ink dark:text-cloud">{t("about.version")}</span>
              <span className="font-mono text-xs tabular-nums text-ink/60 dark:text-cloud/60">{appVersion}</span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/terms" className="font-extrabold text-ink hover:text-sky dark:text-cloud">
                {t("about.terms")}
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40 dark:text-cloud/40" />
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/privacy" className="font-extrabold text-ink hover:text-sky dark:text-cloud">
                {t("about.privacy")}
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40 dark:text-cloud/40" />
            </li>
            <li className="flex items-center justify-between py-2.5">
              <Link href="/support" className="font-extrabold text-ink hover:text-sky dark:text-cloud">
                {t("about.support")}
              </Link>
              <ChevronLeft size={16} className="rotate-180 text-ink/40 dark:text-cloud/40" />
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
      <span className="mt-0.5 text-ink/60 dark:text-cloud/60">{icon}</span>
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-ink/65 dark:text-cloud/65">
          {title}
        </h2>
        <p className="text-xs text-ink/50 dark:text-cloud/50">{description}</p>
      </div>
    </div>
  );
}
