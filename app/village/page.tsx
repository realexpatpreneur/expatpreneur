import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Ask & Offer, ExpatPreneurs Global" };

export default async function VillagePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await requireMember("/village");
  const supabase = await createClient();

  let query = supabase
    .from("asks")
    .select("id, kind, reach, title, body, category, status, created_at, author_id, village_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(40);

  if (show === "asks") query = query.eq("kind", "ask");
  if (show === "offers") query = query.eq("kind", "offer");
  if (show === "mine") query = query.eq("author_id", member.id);

  const { data: posts } = await query;

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, village_id")
        .in("id", authorIds)
    : { data: [] };

  const authorOf = (id: string) => authors?.find((a) => a.id === id);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Ask &amp; Offer</h1>
          <p className="lead">
            {member.villageName
              ? `What the ${member.villageName} Village needs this week, and what people can give.`
              : "What members need this week, and what people can give."}
          </p>
          <p>
            <Link className="btn primary" href="/village/new">
              Post something
            </Link>
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["asks", "Asks"],
              ["offers", "Offers"],
              ["mine", "Mine"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/village?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          {(posts ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing open at the moment. Be the first to ask.
              </p>
            </div>
          ) : (
            <div className="rows">
              {(posts ?? []).map((post) => {
                const author = authorOf(post.author_id);
                const elsewhere =
                  author?.village_id && author.village_id !== member.village_id;
                return (
                  <Link className="rowlink" key={post.id} href={`/village/${post.id}`}>
                    <div>
                      <span className={`chip ${post.kind === "offer" ? "mint" : "blue"}`}>
                        {post.kind === "offer" ? "Offer" : "Ask"}
                      </span>{" "}
                      <b>{post.title}</b>
                      <div className="muted small">
                        {author?.full_name ?? "A member"}
                        {post.category ? `. ${post.category}` : ""}.{" "}
                        {timeAgo(post.created_at)}.
                      </div>
                    </div>
                    <div className="rowmeta">
                      {post.reach === "all_villages" ? (
                        <span className="chip">Every Village</span>
                      ) : null}
                      {elsewhere ? <span className="chip sun">Another Village</span> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}