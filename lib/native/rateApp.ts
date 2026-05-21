/**
 * In-app review prompt — Apple-HIG compliant.
 *
 * Apple allows up to 3 SKStoreReviewController.requestReview() calls per
 * 365-day window per user. They throttle silently when you exceed it, so
 * spamming the call is harmless but pointless. We add our own gates on top:
 *
 *   1. Native platform only (no-op on web).
 *   2. localStorage flag — never prompt the same user twice via our code,
 *      regardless of Apple's underlying throttle.
 *   3. Triggered only after meaningful success (e.g., 5 lessons completed
 *      or first perfect lesson). Caller decides when to invoke.
 *
 * The plugin `capacitor-rate-app` doesn't ship in the current package.json,
 * so we lazy-import inside try/catch — in dev (where the plugin isn't
 * registered) the call silently no-ops.
 */

import { isNative } from "@/lib/capacitor";

const STORAGE_KEY = "lori.review.prompted";

export async function maybePromptReview(): Promise<void> {
  if (!isNative()) return;
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  try {
    // Dynamic import — plugin is optional + not in package.json yet, so
    // the module specifier is computed at runtime to keep TS quiet AND
    // give the bundler a tree-shake hint. When ops adds the plugin, the
    // import resolves; until then this throws and the catch swallows.
    const moduleSpec = "capacitor-rate-app";
    const mod = await (Function("s", "return import(s)") as (
      s: string,
    ) => Promise<unknown>)(moduleSpec);
    const RateApp = (mod as { RateApp?: { requestReview: () => Promise<unknown> } })
      .RateApp;
    if (!RateApp) return;
    await RateApp.requestReview();
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Plugin not installed / native sheet failed / user dismissed — no-op.
    // We don't even set the flag in this case, so a future deploy that
    // does ship the plugin can still prompt.
  }
}
