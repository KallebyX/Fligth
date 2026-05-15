// Browser-side Sentry initialization. Loaded automatically by
// @sentry/nextjs when the app boots client-side (no manual import needed).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    // Trace 10% of transactions in prod, 100% in preview/dev. Capacitor
    // shell loads the same URL, so its errors flow through here too.
    tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 0.1 : 1.0,
    // Send PII off — Supabase user IDs are anonymized via Sentry's setUser
    // pattern where appropriate; we don't ship raw emails.
    sendDefaultPii: false,
    // Replay only on errors (cheaper) so a regression that hits 1 user gives
    // us a session video without a 100% sampled hose of every page.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}
