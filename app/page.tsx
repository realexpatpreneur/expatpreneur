import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const covers = ["blue", "mint", "pink", "paper"] as const;

const statusLine: Record<string, string> = {
  open: "Open, invitation only",
  launching: "Launching soon",
  exploring: "Register interest",
  paused: "Paused",
  archived: "Archived",
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: user }, { data: villages }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
  ]);

  // Open Villages first, then the ones launching, then the ones being explored.
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const ordered = [...(villages ?? [])].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  );

  // A published page replaces what is written below. A draft leaves it be.
  const page = await livePage("home");

  if (page) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <Blocks blocks={page.blocks} villages={villages ?? []} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader signedIn={Boolean(user?.user)} />

      <main className="wrap">
        <section className="hero">
          <div>
            <h1>Your business needs a village too.</h1>
            <p className="lead">
              A curated network of expat entrepreneurs. Belong to a small,
              trusted community in your city, and reach people you can trust
              in other markets.
            </p>
            <div className="ctas">
              <Link className="btn dark" href="/apply">
                Request your invitation
              </Link>
              <Link className="btn" href="/villages">
                Find your Village
              </Link>
            </div>
            <p className="proverb">
              &ldquo;It takes a village to raise a child.&rdquo; We believe the
              same is true of the businesses we build far from home.
            </p>
          </div>

          <div className="panel art">
            <h3>Three places at once</h3>
            <div className="layers" style={{ marginTop: 14 }}>
              <div className="layer">
                <b>Global</b>
                <span className="muted small">
                  The whole network. Members, events and markets wherever
                  there is a Village.
                </span>
              </div>
              <div className="layer">
                <b>Village</b>
                <span className="muted small">
                  Your city. Local gatherings, local knowledge and the people
                  building around you.
                </span>
              </div>
              <div className="layer">
                <b>Circle</b>
                <span className="muted small">
                  Your home base of up to fifty members, where real
                  relationships form.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="band public">
          <h2>Big enough to open doors. Small enough to know each other.</h2>
          <p className="intro">
            Every member belongs to three places at once. As the network grows,
            your home base stays human sized.
          </p>

          <div className="across">
            <p style={{ flex: 1, minWidth: 220, margin: 0 }}>
              <b>Across all three:</b> Industry Groups connect you with people
              in your field, and Pods bring a few members together around a
              shared goal.
            </p>
            <Link className="btn sm" href="/how-it-works">
              How it works
            </Link>
          </div>
        </section>

        <section className="band public">
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>What members do here</h2>
          </div>
          <div className="grid">
            {[
              [
                "Ask and offer help",
                "Post what you need or what you can give, and track it until it is resolved.",
              ],
              [
                "Find the right people",
                "Search by skill, language and the markets people know.",
              ],
              [
                "Meet in person",
                "Monthly gatherings in your Village, and events in other cities.",
              ],
              [
                "Explore new markets",
                "Talk to members who already build where you want to go.",
              ],
            ].map(([title, text]) => (
              <div className="panel" key={title}>
                <h3>{title}</h3>
                <p className="muted small" style={{ marginTop: 4 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="band public">
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>Villages</h2>
            <Link href="/villages" style={{ fontWeight: 600 }}>
              See all Villages
            </Link>
          </div>
          <div className="grid three">
            {ordered.slice(0, 3).map((village, i) => (
              <article className="card" key={village.id}>
                <div className={`cover ${covers[i % covers.length]}`}>
                  {village.name}
                </div>
                <div className="vbody">
                  <span
                    className={`chip ${
                      village.status === "open" ? "mint" : "sun"
                    }`}
                  >
                    {statusLine[village.status] ?? village.status}
                  </span>
                  <p>
                    {village.country}. {village.summary}
                  </p>
                  <Link className="btn sm" href={`/villages/${village.slug}`}>
                    {village.status === "open"
                      ? `Explore ${village.name}`
                      : "See what is coming"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="band public">
          <div className="story">
            <div className="img" />
            <div>
              <span className="chip pink">From the founder</span>
              <h3 style={{ fontSize: 20, marginTop: 12, maxWidth: "28ch" }}>
                Six countries, one lesson: local belonging needs global
                continuity.
              </h3>
              <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
                Kristiane Charrier on rebuilding her network at every move, and
                why the first ExpatPreneurs community shaped everything that
                followed.
              </p>
              <Link className="btn sm" href="/media">
                Read the story
              </Link>
            </div>
          </div>
        </section>

        <section className="dband">
          <div>
            <h2>Ready to find your Village?</h2>
            <p className="lead">
              ExpatPreneurs is by invitation. Membership itself is free, and
              the paid plan adds every other Village.
            </p>
          </div>
          <Link className="btn" href="/apply">
            Request your invitation
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}