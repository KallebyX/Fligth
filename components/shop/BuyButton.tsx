"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/app/actions/checkout";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";
import { ensureRevenueCat, purchaseSku } from "@/lib/revenuecat";
import { createClient } from "@/lib/supabase/client";

type Mode = "web" | "native" | "blocked";

export function BuyButton({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("web");

  useEffect(() => {
    const platform = detectPlatform();
    if (platform === "web") {
      setMode("web");
      return;
    }
    if (NATIVE_IAP_ENABLED) {
      setMode("native");
      void (async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) {
          try {
            await ensureRevenueCat(data.user.id);
          } catch (err) {
            console.warn("[buy] revenuecat init failed", err);
          }
        }
      })();
      return;
    }
    setMode("blocked");
  }, []);

  function handleClick() {
    setError(null);
    if (mode === "blocked") {
      setError("Compras pelo app ainda em revisão — use o navegador.");
      return;
    }
    if (mode === "native") {
      startTransition(async () => {
        const res = await purchaseSku(sku);
        if (!res.ok) {
          if (!res.userCancelled) setError(res.error);
          return;
        }
        // The RevenueCat webhook completes fulfillment server-side. We just
        // bounce the user to the success screen; the next render of /learn
        // will already reflect the credited hearts/freezes.
        window.location.href = "/shop/success?native=1";
      });
      return;
    }
    // Web → Stripe Checkout
    startTransition(async () => {
      const res = await startCheckout(sku);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    });
  }

  const label = pending
    ? "Abrindo..."
    : mode === "blocked"
      ? "Abrir no navegador"
      : "Comprar";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={pending}>
        {label}
      </Button>
      {error && <span className="text-[10px] text-alert">{error}</span>}
    </div>
  );
}
