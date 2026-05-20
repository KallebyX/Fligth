import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://capitaolori.com";

// Allow crawling of the public marketing/info pages; block the
// authenticated app surfaces (they're behind cookies anyway, but
// being explicit avoids "soft 404 / login redirect" weirdness in
// Search Console).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/signup",
          "/privacy",
          "/terms",
          "/support",
          "/escolas",
          "/escolas/", // includes sub-paths
        ],
        disallow: [
          "/learn",
          "/leagues",
          "/shop",
          "/friends",
          "/profile",
          "/configuracoes",
          "/galeria",
          "/admin",
          "/exam",
          "/review",
          "/api/",
          "/callback",
          "/reset-password",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
