"use client";

import { useEffect, useState } from "react";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";

export function NativeBuyNotice() {
  const [platform, setPlatform] = useState<"web" | "ios" | "android">("web");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  if (platform === "web") return null;
  if (NATIVE_IAP_ENABLED) return null;

  const storeName = platform === "ios" ? "App Store" : "Google Play";
  return (
    <div className="mb-4 rounded-2xl border-2 border-sun bg-sun/10 p-4 text-sm text-ink/80">
      <strong>Em revisão:</strong> as compras dentro do app de iOS/Android vão usar pagamento
      nativo da {storeName}. Por enquanto, abra a loja pelo navegador para comprar com cartão,
      Apple Pay, Google Pay ou PIX.
    </div>
  );
}
