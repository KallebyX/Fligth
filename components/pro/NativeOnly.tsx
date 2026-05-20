"use client";

import { useEffect, useState, type ReactNode } from "react";
import { detectPlatform, NATIVE_IAP_ENABLED } from "@/lib/platform";

/**
 * Renders children only on the native iOS / Android shell with IAP
 * enabled. Web users see nothing (no flash — initial render is null
 * until the platform check completes post-mount).
 */
export function NativeOnly({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    if ((p === "ios" || p === "android") && NATIVE_IAP_ENABLED) setShow(true);
  }, []);

  if (!show) return null;
  return <>{children}</>;
}
