"use client";

import { useState, useTransition } from "react";
import { Bell, Mail, Loader2 } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/app/actions/notificationPrefs";
import { cn } from "@/lib/utils";

type Key = keyof NotificationPrefs;

const PUSH_ROWS: { key: Key; label: string; description: string }[] = [
  {
    key: "push_streak",
    label: "Ofensiva em risco",
    description: "Lembrete diário às 18h se você ainda não treinou.",
  },
  {
    key: "push_friends",
    label: "Amigos & seguidores",
    description: "Quando alguém te segue ou completa uma conquista.",
  },
  {
    key: "push_leagues",
    label: "Ligas semanais",
    description: "Quando você sobe ou cai de liga toda segunda.",
  },
  {
    key: "push_promotions",
    label: "Promoções & novidades",
    description: "Ofertas de Pro, novos outfits, eventos.",
  },
];

const EMAIL_ROWS: { key: Key; label: string; description: string }[] = [
  {
    key: "email_product_updates",
    label: "Atualizações de produto",
    description: "Novas funcionalidades, lições, lançamentos.",
  },
  {
    key: "email_security",
    label: "Segurança da conta",
    description:
      "Mudanças de senha, novos logins, alertas de acesso suspeito. Recomendamos manter ligado.",
  },
];

export function NotificationPrefsSection({
  initial,
}: {
  initial: NotificationPrefs;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(key: Key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setError(null);
    startTransition(async () => {
      const res = await updateNotificationPrefs({ [key]: next[key] });
      if (!res.ok) {
        setError(res.error);
        // Revert on failure.
        setPrefs(prefs);
      }
    });
  }

  return (
    <Card>
      <CardTitle>Preferências de notificação</CardTitle>
      <CardDesc>
        Escolha o que você quer receber. Você pode mudar a qualquer momento.
      </CardDesc>

      <div className="mt-4 space-y-3">
        <Section icon={<Bell size={16} />} title="Push notifications">
          {PUSH_ROWS.map(({ key, label, description }) => (
            <PrefRow
              key={key}
              label={label}
              description={description}
              value={prefs[key]}
              onChange={() => toggle(key)}
              busy={busy}
            />
          ))}
        </Section>

        <Section icon={<Mail size={16} />} title="Emails">
          {EMAIL_ROWS.map(({ key, label, description }) => (
            <PrefRow
              key={key}
              label={label}
              description={description}
              value={prefs[key]}
              onChange={() => toggle(key)}
              busy={busy}
            />
          ))}
        </Section>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
    </Card>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-ink/55 dark:text-cloud/55">
        {icon}
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function PrefRow({
  label,
  description,
  value,
  onChange,
  busy,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
  busy: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl bg-cloud/60 p-3 transition-colors dark:bg-ink-deep/40",
        "hover:bg-cloud-deep/30 dark:hover:bg-ink-deep/60",
        busy && "opacity-60",
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-extrabold text-ink dark:text-cloud">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-ink/65 dark:text-cloud/65">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onChange}
        disabled={busy}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-mid",
          value ? "bg-sky" : "bg-cloud-deep/60 dark:bg-ink-light/60",
          busy && "cursor-not-allowed",
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span
          className={cn(
            "absolute top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform",
            value ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        >
          {busy && <Loader2 size={10} className="animate-spin text-ink/50" />}
        </span>
      </button>
    </label>
  );
}
