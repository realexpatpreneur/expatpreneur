import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";

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

  const user = await currentUser();

  let query = supabase
    .from("media_items")
    .select("id, slug, kind, title, summary, duration, member_only, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  if (show !== "all") query = query.eq("kind", show);

  const [{ data: items }, { data: shows }] = await Promise.all([
    query,
    supabase
      .from("shows")
      .select("slug, name, about, cover_url")
      .order("name"),
  ]);

  // How many episodes each show has, so the row can say.
  const { data: episodeCounts } = await supabase
    .from("media_items")
    .select("show_slug")
    .eq("kind", "episode")
    .not("published_at", "is", null);

  const episodesIn = (slug: string) =>
    (episodeCounts ?? []).filter((e) => e.show_slug === slug).length;

  return (
    <DualPage member={Boolean(user)} nav="/watch" active="/watch">
      <PageBlocks slug="watch">
        <section className={user ? "sec" : "pubsec hero-center"}>
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
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/watch?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
</section>

        {(shows ?? []).length && show !== "video" && show !== "article" ? (
          <section className="sec">
            <div className="sechead">
              <h2 style={{ fontSize: 20 }}>The shows</h2>
            </div>
            <div className="pshows">
              {(shows ?? []).map((item) => (
                <Link
                  className="pshow linkrow"
                  key={item.slug}
                  href={`/watch/show/${item.slug}`}
                >
                  {item.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.cover_url} alt="" />
                  ) : (
                    <span className="cover navy">{item.name}</span>
                  )}
                  <div>
                    <b>{item.name}</b>
                    <div className="muted small">{item.about}</div>
                    <div className="muted small">
                      {episodesIn(item.slug)}{" "}
                      {episodesIn(item.slug) === 1 ? "episode" : "episodes"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>
              {show === "episode" ? "Latest episodes" : "Latest"}
            </h2>
          </div>
          {(items ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="g3">
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
            </PageBlocks>
</DualPage>
        );
}