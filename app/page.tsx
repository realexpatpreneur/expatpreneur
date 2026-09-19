import Link from "next/link";
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
      .select("id, slug, name, country, status, summary")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
  ]);

  // Open Villages first, then the ones launching, then the ones being explored.
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const ordered = [...(villages ?? [])].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  );

  return (
    <>
      <SiteHeader signedIn={Boolean(user?.user)} />

      <main className="wrap">
        <section className="band">
          <h1>Your business needs a village too.</h1>
          <p className="lead">
            A curated network of expat entrepreneurs. Belong to a small, trusted
            community in your city, and reach people you can trust in other
            markets.
          </p>
          <p>
            <Link className="btn primary" href="/apply">
              Request your invitation
            </Link>{" "}
            <Link className="btn" href="/villages">
              Find your Village
            </Link>
          </p>
        </section>

        <section className="band">
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

        <section className="band cta">
          <h2>Ready to find your Village?</h2>
          <p style={{ color: "#fff" }}>
            ExpatPreneurs is by invitation. Membership itself is free. The paid
            plan adds every Village.
          </p>
          <Link className="btn" href="/apply">
            Request your invitation
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}