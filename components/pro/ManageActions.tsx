"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { openStripePortal } from "@/app/actions/openStripePortal";
import { isNative } from "@/lib/capacitor";
import { openNativeManageSubscriptions } from "@/lib/revenuecat";
import { RestoreButton } from "@/components/pro/RestoreButton";

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
      <div className="space-y-3">
        <p className="rounded-2xl bg-grass/10 px-3 py-2 text-sm font-bold text-grass-deep dark:bg-grass/20 dark:text-grass-soft">
          ✓ Compra única — nada pra gerenciar. Você tem acesso pra sempre.
        </p>
        <RestoreButton variant="ghost" />
      </div>
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
      const map: Record<string, string> = {
        no_active_subscription:
          "Você não tem uma assinatura ativa pra gerenciar. Confira os planos abaixo.",
        subscription_not_found_on_stripe:
          "Sua assinatura sumiu do Stripe — fale com o suporte ou refaça o checkout.",
        no_customer: "Não encontramos sua conta no Stripe. Fale com o suporte.",
        unauthenticated: "Sua sessão expirou. Faça login novamente.",
      };
      setError(map[result.error] ?? "Falha ao abrir o portal. Tente novamente.");
      setBusy(false);
    }
  }

  async function manageNative() {
    setBusy(true);
    setError(null);
    const ok = await openNativeManageSubscriptions();
    setBusy(false);
    if (!ok) {
      setError(
        "Não consegui abrir a página de assinaturas. Abra Ajustes → seu nome → Assinaturas manualmente.",
      );
    }
  }

  if (provider === "apple_iap" || provider === "google_iap") {
    const isApple = provider === "apple_iap";
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={manageNative}
          disabled={busy}
        >
          {busy ? (
            <Loader2 size={18} aria-hidden className="animate-spin" />
          ) : (
            <>
              <ExternalLink size={16} aria-hidden />
              {isApple ? "Gerenciar na App Store" : "Gerenciar no Google Play"}
            </>
          )}
        </Button>
        <p className="text-xs text-ink/55 dark:text-cloud/55">
          {isApple
            ? "Abre a página de Assinaturas da Apple. Você pode trocar de plano, pausar ou cancelar lá."
            : "Abre Assinaturas do Google Play. Mude de plano, pause ou cancele lá."}
        </p>
        <RestoreButton variant="outline" />
        {error && (
          <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
            {error}
          </p>
        )}
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
          <Loader2 size={18} aria-hidden className="animate-spin" />
        ) : (
          <>
            <ExternalLink size={16} aria-hidden />
            Gerenciar assinatura
          </>
        )}
      </Button>
      {error && (
        <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
      <p className="text-center text-xs text-ink/50 dark:text-cloud/50">
        Abre o portal seguro do Stripe pra cancelar, trocar de cartão ou
        mudar o plano.
      </p>
      <RestoreButton variant="ghost" />
    </div>
  );
}
