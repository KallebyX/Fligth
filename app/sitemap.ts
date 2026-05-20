import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

// Sitemap drives Google + Bing discovery for the public surfaces.
// Only includes pages that don't require auth — protected app pages
// (/learn, /leagues, /shop, etc) are hidden from crawlers by robots.txt
// and would just return a login redirect to a bot anyway.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://capitaolori.com";

export const revalidate = 3600; // re-generate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // Static public pages — high priority because they convert.
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic: every public, active aviation school gets a SEO-friendly
  // page at /escolas/[slug]. These are evergreen content.
  let schoolPages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabase
      .from("schools")
      .select("slug, updated_at")
      .eq("status", "active");
    schoolPages = (data ?? []).map((s) => ({
      url: `${SITE_URL}/escolas/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Surface gracefully — sitemap still serves the static pages.
  }

  return [...staticPages, ...schoolPages];
}
