import type { MetadataRoute } from "next";
import { listLiveEvents, listLiveCities } from "@/lib/queries";

// Generated at request time so new live events/cities appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sattvikbeats.com";
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
  ];

  // Resilient: if the DB is unreachable (e.g. at build), still return the base URL.
  try {
    const [events, cities] = await Promise.all([listLiveEvents(), listLiveCities()]);
    for (const c of cities) {
      entries.push({ url: `${base}/${c.slug}`, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const e of events) {
      entries.push({ url: `${base}/e/${e.slug}`, changeFrequency: "weekly", priority: 0.9 });
    }
  } catch {
    // ignore — base URL already included
  }

  return entries;
}
