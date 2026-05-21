"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";
import { ensureRevenueCat, getNativePrices } from "@/lib/revenuecat";
import { createClient } from "@/lib/supabase/client";

type Ctx = {
  native: boolean;
  prices: Record<string, string>;
  ready: boolean;
};

const NativePriceContext = createContext<Ctx>({
  native: false,
  prices: {},
  ready: false,
});

export function NativePriceProvider({
  skus,
  children,
}: {
  skus: string[];
  children: ReactNode;
}) {
  const [state, setState] = useState<Ctx>({
    native: false,
    prices: {},
    ready: false,
  });

  useEffect(() => {
    const p = detectPlatform();
    const native = (p === "ios" || p === "android") && NATIVE_IAP_ENABLED;
    if (!native) {
      setState({ native: false, prices: {}, ready: true });
      return;
    }

    let canceled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) await ensureRevenueCat(data.user.id);
        const prices = await getNativePrices(skus);
        if (!canceled) {
          setState({ native: true, prices, ready: true });
        }
      } catch {
        if (!canceled) setState({ native: true, prices: {}, ready: true });
      }
    })();
    return () => {
      canceled = true;
    };
  }, [skus]);

  return (
    <NativePriceContext.Provider value={state}>
      {children}
    </NativePriceContext.Provider>
  );
}

export function useNativePrice(sku: string): {
  /** StoreKit-localized price (e.g. "R$ 19,90") if available — null otherwise. */
  nativePrice: string | null;
  /** True when running inside the iOS / Android Capacitor shell with IAP enabled. */
  isNative: boolean;
  /** True after the first attempt at fetching prices completed. */
  ready: boolean;
} {
  const ctx = useContext(NativePriceContext);
  return {
    nativePrice: ctx.prices[sku] ?? null,
    isNative: ctx.native,
    ready: ctx.ready,
  };
}
