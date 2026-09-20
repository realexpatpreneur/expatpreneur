import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Watch and Listen, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

const kindLabel: Record<string, string> = {
  video: "Video",
  episode: "Podcast",
  article: "Article",
};

// Open to everyone. Members also see the pieces kept for members.
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("media_items")
    .select("id, slug, kind, title, summary, duration, member_only, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  if (show !== "all") query = query.eq("kind", show);

  const { data: items } = await query;

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="wrap">
        <section className="band">
          <h1>Watch and Listen</h1>
          <p className="lead">
            Members talking about what building a business away from home
            actually takes.
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["video", "Videos"],
              ["episode", "Podcast"],
              ["article", "Articles"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/watch?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
                  <p>
            <Link className="btn" href="/watch/show/expatpreneurs">
              The ExpatPreneurs Podcast
            </Link>
          </p>
</section>

        <section className="band">
          {(items ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(items ?? []).map((item, i) => (
                <article className="card" key={item.id}>
                  <Link href={`/watch/${item.slug}`}>
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {item.title}
                    </div>
                    <div className="kind">
                      {kindLabel[item.kind] ?? item.kind}
                      {item.duration ? `, ${item.duration}` : ""}
                    </div>
                    <p>{item.summary}</p>
                    {item.member_only ? (
                      <div className="meta">
                        <span className="chip">Members only</span>
                      </div>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      {user ? null : <SiteFooter />}
    </>
  );
}