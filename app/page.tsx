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
            <span className="kicker">By invitation, in eleven cities</span>
            <h1>Your business needs a village too.</h1>
            <p className="lead">
              A curated network of expat entrepreneurs. Belong to a small,
              trusted community in your city, and reach people you can trust
              in other markets.
            </p>
            <p style={{ marginTop: 18 }}>
              <Link className="btn primary" href="/apply">
                Request your invitation
              </Link>{" "}
              <Link className="btn" href="/discover">
                Look around first
              </Link>
            </p>
            <p className="note">
              Membership is free. Somebody reads every request.
            </p>
          </div>

          <div className="panel">
            <h3>Three places at once</h3>
            <div className="layers" style={{ marginTop: 14 }}>
              <div className="layer">
                <b>Your Circle</b>
                <span className="muted small">
                  Up to fifty people who actually know each other.
                </span>
              </div>
              <div className="layer">
                <b>Your Village</b>
                <span className="muted small">
                  Everybody in your city, and what is on this month.
                </span>
              </div>
              <div className="layer">
                <b>The network</b>
                <span className="muted small">
                  Every other city, when you need a market you do not know.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="band public">
          <h2>Villages</h2>
          <div className="grid">
            {ordered.map((village, i) => (
              <article className="card" key={village.id}>
                <Link href={`/villages/${village.slug}`}>
                  <div className={`cover ${covers[i % covers.length]}`}>
                    {village.name}
                  </div>
                  <div className="kind">{village.country}</div>
                  <p>{village.summary}</p>
                  <div className="meta">
                    {statusLine[village.status] ?? village.status}
                  </div>
                </Link>
              </article>
            ))}
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