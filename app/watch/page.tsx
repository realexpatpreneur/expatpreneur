import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { PlayIcon, PHOTO } from "@/components/design/parts";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";

export const metadata = { title: "Watch and Listen, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

// Photographs for pieces that have no cover of their own yet.
const COVERS = [PHOTO.kristiane, PHOTO.ines, PHOTO.members, PHOTO.table, PHOTO.julien, PHOTO.reader];

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
    .select("id, slug, kind, title, summary, duration, member_only, published_at, cover_url, show_slug")
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

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!user) {
    const all = items ?? [];
    const videos = all.filter((m) => m.kind === "video");
    const episodes = all.filter((m) => m.kind === "episode");
    const articles = all.filter((m) => m.kind === "article");
    const lead = show === "episode" ? null : videos[0] ?? (show === "all" ? null : all[0]) ?? null;
    const grid = (show === "article" ? articles : videos).filter((m) => m !== lead);
    const showName = (slug: string | null) => (shows ?? []).find((x) => x.slug === slug)?.name ?? "";
    const cover = (m: { cover_url: string | null }, i: number) => m.cover_url ?? COVERS[i % COVERS.length];

    return (
      <PublicPage active="/watch">
        <PageBlocks slug="watch">
        <div className="d-page">
          <section className="d-dark" style={{ padding: "72px 0 80px" }}>
            <div className="d-wrap">
              <p className="d-eyebrow">Watch and Listen</p>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "22ch" }}>
                Members talking about what building a business away from home actually takes.
              </h1>
              {lead ? (
                <div className="d-feat" style={{ marginTop: 48 }}>
                  <Link className="d-vid" href={`/watch/${lead.slug}`} style={{ color: "#FFFFFF" }}>
                    <span className="d-thumb d-shine" style={{ aspectRatio: "16 / 9" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover(lead, 0)} alt="" style={{ objectPosition: "center 22%" }} />
                      <span className="d-play d-play-lg"><PlayIcon size={30} /></span>
                      {lead.duration ? <span className="d-dur">{lead.duration}</span> : null}
                    </span>
                  </Link>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#8C98A4" }}>
                      {kindLabel[lead.kind] ?? lead.kind}{lead.duration ? `, ${lead.duration}` : ""}
                    </span>
                    <Link href={`/watch/${lead.slug}`} style={{ display: "block", marginTop: 12, fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.025em", color: "#FFFFFF" }}>
                      {lead.title}
                    </Link>
                    {lead.summary ? (
                      <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, color: "#B9C3CD" }}>{lead.summary}</p>
                    ) : null}
                    {/* "Our YouTube channel" and "Follow the podcast"
                        went to youtube.com and open.spotify.com, the
                        services' own front pages. The real addresses are
                        columns on the shows table, which the show page
                        reads properly, so this sends people there rather
                        than off the site to nothing. */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
                      <Link className="d-btn d-btn-mint d-shine" href="/watch?show=episode">Episodes and videos</Link>
                      <Link className="d-btn d-btn-ghost" href="/media">Read the stories</Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="d-wrap">
            <nav className="d-tabs" aria-label="Show">
              {[["all", "Everything"], ["video", "Videos"], ["episode", "Podcast"], ["article", "Articles"]].map(([key, label]) => (
                <Link key={key} className={show === key ? "on" : ""} href={`/watch?show=${key}`}>{label}</Link>
              ))}
            </nav>
          </div>

          {show !== "episode" && grid.length ? (
            <section style={{ padding: "64px 0 0" }}>
              <div className="d-wrap">
                <h2 className="d-h2" style={{ marginBottom: 28 }}>{show === "article" ? "Articles" : "Videos"}</h2>
                <div className="d-vgrid">
                  {grid.map((m, i) => (
                    <Link className="d-vid" key={m.id} href={`/watch/${m.slug}`}>
                      <span className="d-thumb d-shine" style={{ aspectRatio: "16 / 9" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cover(m, i + 1)} alt="" />
                        {m.kind === "video" ? <span className="d-play" style={{ width: 52, height: 52, margin: "-26px 0 0 -26px" }}><PlayIcon /></span> : null}
                        {m.duration ? <span className="d-dur">{m.duration}</span> : null}
                      </span>
                      <b style={{ display: "block", marginTop: 14, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{m.title}</b>
                      <span className="d-small" style={{ display: "block", marginTop: 4, fontSize: 13 }}>
                        {kindLabel[m.kind] ?? m.kind}{m.member_only ? ", members only" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {(shows ?? []).length && show !== "video" && show !== "article" ? (
            <section style={{ padding: "96px 0 0" }}>
              <div className="d-wrap">
                <h2 className="d-h2" style={{ marginBottom: 28 }}>The shows</h2>
                <div className="d-shows">
                  {(shows ?? []).map((item, i) => (
                    <Link className="d-show" key={item.slug} href={`/watch/show/${item.slug}`}>
                      <span className="d-showcover" style={item.cover_url ? { padding: 0 } : { background: i % 2 ? "#A8DCD1" : "#0F1419", color: i % 2 ? "#0F1419" : "#FFFFFF" }}>
                        {item.cover_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.cover_url} alt="" />
                        ) : (
                          <>
                            <span style={{ width: 26, height: 26, borderRadius: 7, background: i % 2 ? "#0F1419" : "#A8DCD1", color: i % 2 ? "#FFFFFF" : "#0F1419", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800 }}>EP</span>
                            <b style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.02em" }}>{item.name}</b>
                          </>
                        )}
                      </span>
                      <span>
                        <b style={{ display: "block", fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{item.name}</b>
                        {item.about ? <span className="d-body" style={{ display: "block", marginTop: 8 }}>{item.about}</span> : null}
                        <span style={{ display: "block", marginTop: 12, fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7683" }}>
                          {episodesIn(item.slug)} {episodesIn(item.slug) === 1 ? "episode" : "episodes"}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {episodes.length && show !== "video" && show !== "article" ? (
            <section style={{ padding: "72px 0 0" }}>
              <div className="d-wrap">
                <h2 className="d-h2" style={{ marginBottom: 8 }}>Latest episodes</h2>
                <div className="d-rows">
                  {episodes.map((m) => (
                    <Link className="d-row d-eprow" key={m.id} href={`/watch/${m.slug}`}>
                      <span>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7683" }}>
                          {showName(m.show_slug) || "Podcast"}
                        </span>
                        <b style={{ display: "block", marginTop: 4, fontSize: 18, fontWeight: 700 }}>{m.title}</b>
                        {m.summary ? <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{m.summary}</span> : null}
                      </span>
                      <span className="d-len" style={{ fontSize: 14, fontWeight: 600, color: "#3B4650" }}>{m.duration}</span>
                      <span className="d-pbtn"><PlayIcon size={16} /></span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {all.length === 0 ? (
            <section style={{ padding: "64px 0 0" }}>
              <div className="d-wrap"><p className="d-body">Nothing published yet.</p></div>
            </section>
          ) : null}

          <section style={{ padding: "96px 0 104px" }}>
            <div className="d-wrap">
              <div className="d-boxed" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
                <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                  <h2 className="d-h2">Have a story the network should hear?</h2>
                  <p className="d-body" style={{ marginTop: 12, fontSize: 16 }}>
                    New stories, videos, podcast episodes and events from every Village.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <Link className="d-btn d-btn-dark d-shine" href="/media">Read the stories</Link>
                  {/* /media/suggest requires a member, and this block is
                      the visitor one, so it sent them to a login. */}
                  <Link className="d-btn d-btn-line d-shine" href="/apply">Request an invitation</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
        </PageBlocks>
      </PublicPage>
    );
  }

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