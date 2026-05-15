"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { openStripePortal } from "@/app/actions/openStripePortal";
import { isNative } from "@/lib/capacitor";

export function ManageActions({
  provider,
  isLifetime,
}: {
  provider: string | null;
  isLifetime: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLifetime) {
    return (
      <p className="rounded-2xl bg-grass/10 px-3 py-2 text-sm font-bold text-grass-deep">
        ✓ Compra única — nada pra gerenciar. Você tem acesso pra sempre.
      </p>
    );
  }

  async function manageStripe() {
    setBusy(true);
    setError(null);
    const result = await openStripePortal();
    if (result.ok) {
      if (isNative()) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: result.url });
      } else {
        window.location.href = result.url;
      }
    } else {
      setError(
        result.error === "no_customer"
          ? "Não encontramos sua conta no Stripe. Fale com o suporte."
          : "Falha ao abrir o portal. Tente novamente.",
      );
      setBusy(false);
    }
  }

  if (provider === "apple_iap" || provider === "google_iap") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink/70">
          Sua assinatura foi feita pela App Store. Pra cancelar ou trocar de
          plano, abra <strong>Ajustes do iOS → seu nome → Assinaturas</strong>{" "}
          e selecione Capitão Lorí.
        </p>
        <p className="text-xs text-ink/50">
          Política da Apple: assinaturas via App Store só podem ser gerenciadas
          dentro do app de Ajustes da Apple.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant="primary"
        className="w-full"
        onClick={manageStripe}
        disabled={busy}
      >
        {busy ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <ExternalLink size={16} />
            Gerenciar assinatura
          </>
        )}
      </Button>
      {error && (
        <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
      <p className="text-center text-xs text-ink/50">
        Abre o portal seguro do Stripe pra cancelar, trocar de cartão ou
        mudar o plano.
      </p>
    </div>
  );
}
