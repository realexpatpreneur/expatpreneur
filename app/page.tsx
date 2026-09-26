import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { HeroPreview, LayerCards } from "@/components/bits";
import { VillageCard, BusinessCard, type BusinessRow } from "@/components/cards";
import { Ic } from "@/components/icon";

// The home page, block for block as the prototype lays it out.
export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }, { data: businesses }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
    supabase.from("village_public_counts").select("village_id, members, circles"),
    supabase
      .from("businesses")
      .select("id, slug, name, category, summary, offer, image_url")
      .eq("public", true)
      .limit(3),
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
        <Blocks blocks={page.blocks} villages={villages ?? []} />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <section className="hero">
        <div>
          <h1>Your business needs a village too.</h1>
          <p className="lead">
            A curated network of expat entrepreneurs. Belong to a small, trusted
            community in your city, and reach people you can trust in other
            markets.
          </p>
          <div className="ctas">
            <Link className="btn btn-primary" href="/apply">
              Request your invitation
            </Link>
            <Link className="btn btn-ghost" href="/villages">
              Find your Village
            </Link>
          </div>
          <p className="proverb">
            &ldquo;It takes a village to raise a child.&rdquo; We believe the
            same is true of the businesses we build far from home.
          </p>
        </div>
        <div className="art">
          <HeroPreview />
        </div>
      </section>

      <section className="pubsec">
        <h2>Big enough to open doors. Small enough to know each other.</h2>
        <p className="intro">
          Every member belongs to three places at once. As the network grows,
          your home base stays human sized.
        </p>
        <LayerCards />
        <div className="across">
          <Ic name="users" style={{ color: "#24675A" }} />
          <p style={{ flex: 1, minWidth: 220 }}>
            <b>Across all three:</b> Industry Groups connect you with people in
            your field, and Pods bring a few members together around a shared
            goal.
          </p>
          <Link className="btn btn-ghost btn-sm" href="/how-it-works">
            How it works
          </Link>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>What members do here</h2>
        </div>
        <div className="g4 g3">
          {(
            [
              ["hand", "Ask and offer help", "Post what you need or what you can give, and track it until it is resolved."],
              ["users", "Find the right people", "Search by skill, language and the markets people know."],
              ["cal", "Meet in person", "Monthly gatherings in your Village, and events in other cities."],
              ["globe", "Explore new markets", "Talk to members who already build where you want to go."],
            ] as const
          ).map(([icon, title, text]) => (
            <div className="panel" key={title}>
              <Ic name={icon} style={{ color: "var(--blue)" }} />
              <h3 style={{ fontSize: 14, marginTop: 10 }}>{title}</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>Villages</h2>
          <Link href="/villages" style={{ fontWeight: 600 }}>
            See all Villages
          </Link>
        </div>
        <div className="g3">
          {ordered.slice(0, 3).map((village) => (
            <VillageCard key={village.slug} village={village} />
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="story">
          <div className="img" role="img" aria-label="Members in conversation" />
          <div>
            <span className="chip chip-pink">From the founder</span>
            <h3 style={{ fontSize: 20, marginTop: 12, maxWidth: "28ch" }}>
              Six countries, one lesson: local belonging needs global
              continuity.
            </h3>
            <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
              Kristiane Charrier on rebuilding her network at every move, and
              why the first ExpatPreneurs community in Luanda shaped everything
              that followed.
            </p>
            <Link className="btn btn-ghost btn-sm" href="/media">
              Read the story
            </Link>
          </div>
        </div>
      </section>

      {businesses && businesses.length ? (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>Businesses in the network</h2>
            <Link href="/businesses" style={{ fontWeight: 600 }}>
              Browse all
            </Link>
          </div>
          <div className="g3">
            {businesses.map((biz, i) => (
              <BusinessCard key={biz.id} biz={biz as BusinessRow} i={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="band">
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 22 }}>Ready to find your Village?</h2>
            <p style={{ marginTop: 6 }}>
              ExpatPreneurs is by invitation. Membership itself is free; the
              paid plan adds every Village.
            </p>
          </div>
          <Link className="btn btn-mint" href="/apply">
            Request your invitation
          </Link>
          <Link className="btn btn-ghost" href="/events">
            Come to an open evening
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}