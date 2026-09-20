import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Network intelligence, the Global team" };

// Where members look across markets, where demand is not being met, and
// how opportunities move between Villages. Every figure here comes from
// what members did, not from a guess.
export default async function NetworkIntelligencePage() {
  await requireGlobal();
  const supabase = await createClient();

  const [
    { data: posts },
    { data: replies },
    { data: villages },
    { data: members },
    { data: pathways },
    { data: connections },
  ] = await Promise.all([
    supabase
      .from("market_posts")
      .select("id, country, industry, author_id, status, created_at"),
    supabase.from("market_replies").select("post_id, author_id, created_at"),
    supabase.from("villages").select("id, name"),
    supabase
      .from("profiles")
      .select("id, village_id, markets_known, lived_in")
      .eq("status", "active"),
    supabase.from("market_pathways").select("id, country, title"),
    supabase
      .from("connection_requests")
      .select("requester_id, recipient_id, status, created_at"),
  ]);

  const villageOf = (id: string | null) =>
    villages?.find((v) => v.id === members?.find((m) => m.id === id)?.village_id)
      ?.name ?? "Somewhere";

  // Which Villages are looking at which markets, and how often somebody
  // answered.
  const interest = new Map<string, { members: Set<string>; answers: number }>();
  for (const post of posts ?? []) {
    const key = `${villageOf(post.author_id)} → ${post.country}`;
    const row = interest.get(key) ?? { members: new Set<string>(), answers: 0 };
    row.members.add(post.author_id);
    row.answers += (replies ?? []).filter((r) => r.post_id === post.id).length;
    interest.set(key, row);
  }

  // A market people ask about, with nobody in the network who knows it.
  const knows = (country: string) =>
    (members ?? []).filter((m) =>
      [...(m.markets_known ?? []), ...(m.lived_in ?? [])].some(
        (place) => place && place.toLowerCase() === country.toLowerCase()
      )
    ).length;

  const countries = [...new Set((posts ?? []).map((p) => p.country))];
  const unmet = countries
    .map((country) => ({
      country,
      interested: (posts ?? []).filter((p) => p.country === country).length,
      experts: knows(country),
      hasPathway: (pathways ?? []).some(
        (p) => p.country?.toLowerCase() === country.toLowerCase()
      ),
    }))
    .filter((row) => row.experts <= 2)
    .sort((a, b) => b.interested - a.interested);

  const answered = (posts ?? []).filter((post) =>
    (replies ?? []).some((r) => r.post_id === post.id)
  ).length;

  const accepted = (connections ?? []).filter((c) => c.status === "accepted").length;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Network intelligence</h1>
          <p className="lead">How the Villages help each other.</p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>Cross Village interest</h3>
                {interest.size === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody has asked about another market yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {[...interest.entries()]
                      .sort((a, b) => b[1].members.size - a[1].members.size)
                      .slice(0, 12)
                      .map(([route, row]) => (
                        <div className="rowlink" key={route}>
                          <div>
                            <b>{route}</b>
                            <div className="muted small">
                              {row.members.size}{" "}
                              {row.members.size === 1 ? "member" : "members"} asking
                            </div>
                          </div>
                          <div className="rowmeta">
                            <span className="chip">{row.answers} answers</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Demand without enough local expertise</h3>
                {unmet.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing asked about that nobody here knows.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {unmet.slice(0, 8).map((row) => (
                      <div className="rowlink" key={row.country}>
                        <div>
                          <b>{row.country}</b>
                          <div className="muted small">
                            {row.interested} asking,{" "}
                            {row.experts === 0
                              ? "nobody with experience"
                              : `${row.experts} with experience`}
                          </div>
                        </div>
                        <div className="rowmeta">
                          {row.hasPathway ? (
                            <span className="chip mint">Pathway exists</span>
                          ) : (
                            <Link className="btn" href="/global/markets">
                              Plan a pathway
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Opportunity routing</h3>
                <dl className="kv">
                  <dt>Market questions asked</dt>
                  <dd>{(posts ?? []).length}</dd>
                  <dt>Answered by somebody</dt>
                  <dd>{answered}</dd>
                  <dt>Still open</dt>
                  <dd>
                    {(posts ?? []).filter((p) => p.status === "open").length}
                  </dd>
                  <dt>Connections accepted across Villages</dt>
                  <dd>{accepted}</dd>
                </dl>
              </div>

              <div className="panel wash">
                <h3>What this is not</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Every figure here comes from what members posted and
                  answered. Nothing is inferred from what they read, and
                  nothing here identifies who looked at whom.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}