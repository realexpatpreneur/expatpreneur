import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// The public pages, and the Villages, articles and events that exist
// today. Built when asked for, so a new Village appears in it the day
// it is created.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = [
    "",
    "/discover",
    "/how-it-works",
    "/membership",
    "/villages",
    "/villages/suggest",
    "/events",
    "/businesses",
    "/learning",
    "/media",
    "/watch",
    "/members",
    "/contact",
    "/apply",
    "/login",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient();
    const [{ data: villages }, { data: articles }] = await Promise.all([
      // Not every Village. /villages/[slug] answers not found for a
      // paused or an archived one, so publishing them here hands a search
      // engine a page that 404s.
      supabase
        .from("villages")
        .select("slug, updated_at")
        .in("status", ["open", "launching", "exploring"]),
      supabase
        .from("articles")
        .select("slug, published_at")
        .eq("status", "published")
        .eq("member_only", false),
    ]);

    return [
      ...fixed,
      ...(villages ?? []).map((v) => ({
        url: `${siteUrl}/villages/${v.slug}`,
        lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...(articles ?? []).map((a) => ({
        url: `${siteUrl}/media/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // If the database is unreachable, the fixed pages are still a
    // sitemap.
    return fixed;
  }
}