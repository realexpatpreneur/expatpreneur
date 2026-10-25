import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { HomeDesign } from "@/components/home-design";

// The home page, block for block as the prototype lays it out.
export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: villages },
    { data: counts },
    { data: businesses },
    { data: events },
    { data: articles },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
    supabase.from("village_public_counts").select("village_id, members, circles"),
    supabase
      .from("businesses")
      .select("id, slug, name, category, tagline, offer, logo_url")
      .eq("public", true)
      .limit(3),
    // A published home page can hold any block, so the rows every block
    // might want are loaded once here.
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url, visibility")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(6),
    supabase
      .from("articles")
      .select("id, slug, title, standfirst, kind, cover_url")
      .eq("status", "published")
      .eq("member_only", false)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("plans")
      .select("slug, name, blurb, price_cents, currency, interval, features")
      .eq("active", true)
      .order("position"),
  ]);

  // Open Villages first, then the ones launching, then the ones being explored.
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const ordered = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }));

  // A published page replaces what is written below. A draft leaves it be.
  const page = await livePage("home");

  if (page) {
    return (
      <PublicPage>
        <Blocks
          blocks={page.blocks}
          data={{
            villages: ordered,
            businesses: businesses ?? [],
            events: events ?? [],
            articles: articles ?? [],
            plans: plans ?? [],
          }}
        />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <HomeDesign
        villages={ordered.map((v) => ({
          slug: v.slug,
          name: v.name,
          country: v.country,
          status: v.status,
          summary: v.summary,
          members: v.members ?? 0,
          circles: v.circles ?? 0,
        }))}
      />
    </PublicPage>
  );
}
