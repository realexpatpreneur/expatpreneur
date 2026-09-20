import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Market Exploration, ExpatPreneurs Global" };

export const stageLabel: Record<string, string> = {
  exploring: "Just exploring",
  have_plan: "Have a plan",
  ready: "Ready to move",
  selling: "Already selling there",
};

export default async function MarketExplorationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const { q = "", show = "all" } = await searchParams;
  const member = await requireMember("/market-exploration");
  const supabase = await createClient();

  let query = supabase
    .from("market_posts")
    .select("id, title, industry, country, city, stage, created_at, author_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (show === "mine") query = query.eq("author_id", member.id);
  if (q) query = query.or(`country.ilike.%${q}%,city.ilike.%${q}%,industry.ilike.%${q}%`);

  const { data: posts } = await query;

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, village_id")
        .in("id", authorIds)
    : { data: [] };

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Market Exploration</h1>
          <p className="lead">
            Looking into a new country or city? Say what you are looking for and
            who you need to meet.
          </p>
          <p>
            <Link className="btn primary" href="/market-exploration/new">
              Post a market question
            </Link>
          </p>
          <form className="searchrow">
            <input name="q" defaultValue={q} placeholder="Country, city or industry" />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
          <div className="tabs">
            <Link className={`chip ${show === "all" ? "mint" : ""}`} href="/market-exploration">
              Everything
            </Link>
            <Link
              className={`chip ${show === "mine" ? "mint" : ""}`}
              href="/market-exploration?show=mine"
            >
              My posts
            </Link>
          </div>
        </section>

        <section className="band">
          <div className="cols">
            <div>
              {(posts ?? []).length === 0 ? (
                <div className="panel wash">
                  <p className="muted" style={{ margin: 0 }}>
                    Nothing here yet. Post the market you are looking into.
                  </p>
                </div>
              ) : (
                <div className="rows">
                  {(posts ?? []).map((post) => {
                    const author = authors?.find((a) => a.id === post.author_id);
                    return (
                      <Link
                        className="rowlink"
                        key={post.id}
                        href={`/market-exploration/${post.id}`}
                      >
                        <div>
                          <span className="chip blue">
                            {post.city ? `${post.city}, ` : ""}
                            {post.country}
                          </span>{" "}
                          <span className="chip">{post.industry}</span>
                          <div style={{ marginTop: 6 }}>
                            <b>{post.title}</b>
                          </div>
                          <div className="muted small">
                            {author?.full_name ?? "A member"}.{" "}
                            {stageLabel[post.stage] ?? post.stage}.{" "}
                            {timeAgo(post.created_at)}.
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>How this differs from Ask &amp; Offer</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Ask &amp; Offer is for what you need this week, usually in your
                  own city. Market Exploration is for the country you are looking
                  into next, and it reaches every Village.
                </p>
                <Link className="btn" href="/village">
                  Go to Ask &amp; Offer
                </Link>
              </div>
              <div className="panel wash">
                <h3>
                  {isPaid(member)
                    ? "You can reply anywhere"
                    : "Reading is open to everyone"}
                </h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {isPaid(member)
                    ? "Paid membership lets you answer members in every Village, so you can offer what you know about a market as well as ask."
                    : "Every member sees every post here. Replying to a member in another Village is part of paid membership."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}