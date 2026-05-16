"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

export function PrivacySection({
  initialProfilePublic,
}: {
  initialProfilePublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialProfilePublic);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !isPublic;
    setIsPublic(next);
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({ profile_public: next });
      if (!res.ok) {
        setError(res.error);
        setIsPublic(!next);
      }
    });
  }

  return (
    <Card>
      <CardTitle>Perfil público</CardTitle>
      <CardDesc>
        Controla se outros usuários conseguem ver seu perfil, XP, ranking e
        atividades pelo @username.
      </CardDesc>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-cloud/60 p-3 hover:bg-cloud-deep/30">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink/70 ring-1 ring-cloud-deep/40">
          {isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-ink">
            {isPublic ? "Perfil visível para todos" : "Perfil privado"}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-ink/65">
            {isPublic
              ? "Qualquer usuário logado pode achar seu perfil pelo @ e seguir você."
              : "Seu perfil não aparece em buscas nem rankings. Só você consegue ver."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={toggle}
          disabled={busy}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            isPublic ? "bg-sky" : "bg-cloud-deep/60",
            busy && "cursor-not-allowed",
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span
            className={cn(
              "absolute top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform",
              isPublic ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          >
            {busy && <Loader2 size={10} className="animate-spin text-ink/50" />}
          </span>
        </button>
      </label>

      {error && (
        <p className="mt-3 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
    </Card>
  );
}
