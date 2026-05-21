"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelDeletion } from "@/app/actions/deleteAccount";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0 min";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`;
  return `${m} min`;
}

export function PendingDeletionBanner({
  executesAt,
}: {
  executesAt: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const target = new Date(executesAt).getTime();
  const remaining = target - now;
  const expired = remaining <= 0;

  function handleCancel() {
    setError(null);
    start(async () => {
      const res = await cancelDeletion();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-alert/40 bg-alert/10 p-4 shadow-soft dark:border-alert/50 dark:bg-alert/15"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alert/20 text-alert">
          <AlertTriangle size={22} />
        </span>
        <div className="flex-1">
          <p className="text-base font-black text-alert dark:text-alert">
            {expired
              ? "Sua exclusão está sendo processada"
              : "Sua conta será excluída em breve"}
          </p>
          <p className="mt-1 text-sm leading-snug text-ink/75 dark:text-cloud/75">
            {expired
              ? "Aguarde alguns minutos — a remoção é automática."
              : (
                <>
                  Tempo restante:{" "}
                  <strong className="text-alert">
                    {formatRemaining(remaining)}
                  </strong>
                  . Mudou de ideia? Cancele agora pra manter tudo.
                </>
              )}
          </p>
          {!expired && (
            <Button
              size="md"
              variant="primary"
              className="mt-3 w-full sm:w-auto"
              onClick={handleCancel}
              disabled={pending}
            >
              {pending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Cancelar exclusão"
              )}
            </Button>
          )}
          {error && (
            <p className="mt-2 text-xs font-bold text-alert">
              Erro: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
