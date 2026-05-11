"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/app/actions/checkout";

export function BuyButton({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(sku);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={pending}>
        {pending ? "Abrindo..." : "Comprar"}
      </Button>
      {error && <span className="text-[10px] text-alert">{error}</span>}
    </div>
  );
}
