import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { PageBuilder } from "@/components/page-builder";
import { Ic } from "@/components/icon";
import type { Block } from "@/lib/blocks";

// The page builder. The rows every block might need are loaded here,
// so what the canvas shows is what the page will show.
export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireGlobal();
  const supabase = await createClient();

  const [
    { data: page },
    { data: villages },
    { data: counts },
    { data: events },
    { data: businesses },
    { data: courses },
    { data: articles },
    { data: plans },
    { data: people },
    { data: media },
    { data: shows },
  ] =
    await Promise.all([
      supabase
        .from("pages")
        .select("slug, title, path, blocks, search_title, search_description, status")
        .eq("slug", slug)
        .maybeSingle(),
      supabase
        .from("villages")
        .select("id, slug, name, city, country, status, summary, cover_url")
        .limit(8),
      supabase.from("village_public_counts").select("village_id, members, circles"),
      supabase
        .from("events")
        .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url, visibility")
        .eq("status", "published")
        .order("starts_at")
        .limit(6),
      supabase
        .from("businesses")
        .select("id, slug, name, category, summary, offer, logo_url")
        .eq("public", true)
        .limit(6),
      supabase
        .from("courses")
        .select("id, slug, title, level, format, price_cents, currency")
        .eq("status", "published")
        .limit(6),
      supabase
        .from("articles")
        .select("id, slug, title, standfirst, kind, cover_url")
        .eq("status", "published")
        .limit(6),
      supabase
        .from("plans")
        .select("slug, name, blurb, price_cents, currency, interval, features")
        .eq("active", true)
        .order("position"),
      supabase
        .from("profiles")
        .select("id, full_name, headline, industry, avatar_url")
        .eq("public_profile", true)
        .eq("status", "active")
        .limit(6),
      supabase
        .from("media_items")
        .select("id, slug, kind, title, summary, duration, cover_url")
        .not("published_at", "is", null)
        .limit(8),
      supabase.from("shows").select("slug, name, about, cover_url").limit(4),
    ]);

  if (!page) notFound();

  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  return (
    <>
      <div className="crumbs">
        <Link href="/global/content">Pages</Link>
        <Ic name="chev" />
        <span>{page.title}</span>
      </div>

      <PageBuilder
        slug={page.slug}
        title={page.title}
        path={page.path}
        status={page.status}
        initial={(page.blocks ?? []) as Block[]}
        data={{
          villages: (villages ?? []).map((v) => ({ ...v, ...countFor(v.id) })),
          events: events ?? [],
          businesses: businesses ?? [],
          courses: courses ?? [],
          articles: articles ?? [],
          plans: plans ?? [],
          people: people ?? [],
          media: media ?? [],
          shows: shows ?? [],
        }}
      />
    </>
  );
}