import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { Arrow, PlayIcon } from "@/components/design/parts";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { Crumbs } from "@/components/crumbs";

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

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    return (
      <PublicPage active="/watch">
        <div className="d-page">
          <section style={{ padding: "48px 0 72px" }}>
            <div className="d-wrap">
              <Crumbs trail={[["Watch and Listen", "/watch"]]} />
              <p className="d-eyebrow" style={{ marginTop: 20 }}>Podcast</p>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "20ch" }}>{show.name}</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch", fontSize: 20 }}>
                {show.about}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                {latest ? (
                  <Link className="d-btn d-btn-dark d-shine" href={`/watch/${latest.slug}`}>
                    Play the latest <Arrow />
                  </Link>
                ) : null}
                {follow.map(([name, href]) => (
                  <a
                    className="d-btn d-btn-line d-shine"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    key={name}
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section className="d-sec d-sec-top0">
            <div className="d-wrap d-media" style={{ gap: 56 }}>
              <div>
                <div className="d-head" style={{ marginBottom: 4 }}>
                  <h2 className="d-h2">Episodes</h2>
                  <span className="d-small">
                    {(episodes ?? []).length}{" "}
                    {(episodes ?? []).length === 1 ? "episode" : "episodes"}
                  </span>
                </div>

                {(episodes ?? []).length === 0 ? (
                  <p className="d-body" style={{ marginTop: 16 }}>
                    Nothing published yet.
                  </p>
                ) : (
                  <div className="d-rows">
                    {(episodes ?? []).map((episode) => (
                      <Link
                        className="d-row d-eprow"
                        href={`/watch/${episode.slug}`}
                        key={episode.id}
                      >
                        <span>
                          <b style={{ display: "block", fontSize: 18, fontWeight: 700 }}>
                            {episode.episode_number
                              ? `${episode.episode_number}. `
                              : ""}
                            {episode.title}
                          </b>
                          <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 14 }}>
                            {episode.summary}
                            {episode.duration ? ` ${episode.duration}` : ""}
                          </span>
                        </span>
                        <span className="d-len" style={{ fontSize: 13, fontWeight: 600, color: "#8A5520" }}>
                          {episode.member_only ? "Members only" : null}
                        </span>
                        <span className="d-pbtn"><PlayIcon size={16} /></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {show.cover_url ? (
                  <span className="d-thumb" style={{ display: "block", aspectRatio: "1 / 1" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={show.cover_url} alt="" />
                  </span>
                ) : null}

                <div className="d-inkbox" style={{ padding: 32, marginTop: show.cover_url ? 24 : 0 }}>
                  <h3 className="d-h2 d-light" style={{ fontSize: 24 }}>
                    The people in these conversations are members
                  </h3>
                  <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: "#B9C3CD" }}>
                    Membership is by invitation.
                  </p>
                  <div style={{ marginTop: 26 }}>
                    <Link className="d-btn d-btn-mint d-shine" href="/apply">
                      Request an invitation <Arrow />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/watch/show" active="/watch/show">
        <section className="sec">
          <Crumbs trail={[["Watch and Listen", "/watch"]]} />
          <p>
            <span className="chip chip-blue">Podcast</span>
          </p>
          <h1>{show.name}</h1>
          <p className="lead">{show.about}</p>

          <p>
            {latest ? (
              <Link className="btn btn-primary" href={`/watch/${latest.slug}`}>
                Play the latest
              </Link>
            ) : null}{" "}
            {follow.map(([name, href]) => (
              <a
                className="btn btn-ghost"
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

        <section className="sec">
          <div className="gside">
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
                <div className="divide" style={{ marginTop: 12 }}>
                  {(episodes ?? []).map((episode) => (
                    <Link
                      className="li linkrow"
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
                <div className="panel panel-wash">
                  <h3>The people in these conversations are members</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Membership is by invitation.
                  </p>
                  <Link className="btn btn-primary" href="/apply">
                    Request an invitation
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </DualPage>
  );
}
