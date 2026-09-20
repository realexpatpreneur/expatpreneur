import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: show } = await supabase
    .from("shows")
    .select("slug, name, about, cover_url, spotify_url, apple_url, youtube_url, rss_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!show) notFound();

  const { data: episodes } = await supabase
    .from("media_items")
    .select("id, slug, title, summary, duration, published_at, episode_number, member_only")
    .eq("show_slug", slug)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const latest = (episodes ?? [])[0];

  const follow = [
    ["Spotify", show.spotify_url],
    ["Apple Podcasts", show.apple_url],
    ["YouTube", show.youtube_url],
    ["RSS", show.rss_url],
  ].filter(([, url]) => Boolean(url)) as [string, string][];

  return (
    <>
      <SiteHeader signedIn={Boolean(member)} />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/watch">Watch and Listen</Link>
          </p>
          <p>
            <span className="chip blue">Podcast</span>
          </p>
          <h1>{show.name}</h1>
          <p className="lead">{show.about}</p>

          <p>
            {latest ? (
              <Link className="btn primary" href={`/watch/${latest.slug}`}>
                Play the latest
              </Link>
            ) : null}{" "}
            {follow.map(([name, href]) => (
              <a
                className="btn"
                href={href}
                target="_blank"
                rel="noreferrer"
                key={name}
              >
                {name}
              </a>
            ))}
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>Episodes</h3>
                <span className="muted small">
                  {(episodes ?? []).length}{" "}
                  {(episodes ?? []).length === 1 ? "episode" : "episodes"}
                </span>
              </div>

              {(episodes ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Nothing published yet.
                </p>
              ) : (
                <div className="rows" style={{ marginTop: 12 }}>
                  {(episodes ?? []).map((episode) => (
                    <Link
                      className="rowlink"
                      href={`/watch/${episode.slug}`}
                      key={episode.id}
                    >
                      <div>
                        <b>
                          {episode.episode_number
                            ? `${episode.episode_number}. `
                            : ""}
                          {episode.title}
                        </b>
                        <div className="muted small">
                          {episode.summary}
                          {episode.duration ? ` ${episode.duration}` : ""}
                        </div>
                      </div>
                      <div className="rowmeta">
                        {episode.member_only ? (
                          <span className="chip">Members only</span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              {show.cover_url ? (
                <div className="shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={show.cover_url} alt="" />
                </div>
              ) : null}

              {member ? null : (
                <div className="panel wash">
                  <h3>The people in these conversations are members</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Membership is by invitation and costs nothing.
                  </p>
                  <Link className="btn primary" href="/apply">
                    Request an invitation
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {member ? null : <SiteFooter />}
    </>
  );
}