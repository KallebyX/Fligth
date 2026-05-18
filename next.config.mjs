import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        // Apple Universal Links: must be served as application/json without redirects.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        // Android App Links: same requirement.
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        // PWA: cache the service worker for very short windows so updates roll out.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

// Sentry wraps the Next config. When SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN are
// absent (e.g. local dev without keys), the runtime SDK simply doesn't init —
// builds and routes work normally. Source-map upload only happens when
// SENTRY_AUTH_TOKEN is set in CI / Vercel project env.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "oryum-tech",
  project: "fligth",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Tunneling through /monitoring lets the SDK ping survive ad-blocker rules.
  tunnelRoute: "/monitoring",
});
