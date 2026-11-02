import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { Arrow, PHOTO } from "@/components/design/parts";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { Crumbs } from "@/components/crumbs";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const user = await currentUser();

  const { data: item } = await supabase
    .from("media_items")
    .select("show_slug, *")
    .eq("slug", slug)
    .maybeSingle();

  if (!item) notFound();

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!user) {
    const stamp = {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase" as const,
    };

    return (
      <PublicPage active="/watch">
        <div className="d-page">
          <section style={{ padding: "48px 0 44px" }}>
            <div className="d-wrap">
              <Crumbs trail={[["Watch and Listen", "/watch"]]} />
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginTop: 20 }}>
                <span style={{ ...stamp, color: "#4074AE" }}>{item.kind}</span>
                {item.duration ? (
                  <span style={{ ...stamp, color: "#6B7683" }}>{item.duration}</span>
                ) : null}
                {item.member_only ? (
                  <span style={{ ...stamp, color: "#8A5520" }}>Members only</span>
                ) : null}
              </div>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "24ch" }}>{item.title}</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch", fontSize: 20 }}>
                {item.summary}
              </p>
              {item.external_url ? (
                <p style={{ marginTop: 32 }}>
                  <a
                    className="d-btn d-btn-dark d-shine"
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.kind === "episode" ? "Listen" : "Watch"} <Arrow />
                  </a>
                </p>
              ) : null}
            </div>
          </section>

          <section>
            <span className="d-thumb" style={{ display: "block", height: "clamp(260px, 46vw, 600px)", borderRadius: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.cover_url ?? PHOTO.members} alt="" />
            </span>
          </section>

          {item.body ? (
            <section style={{ padding: "72px 0 0" }}>
              <div className="d-wrap">
                <p
                  className="d-body"
                  style={{ whiteSpace: "pre-wrap", maxWidth: "68ch", fontSize: 18, lineHeight: 1.75 }}
                >
                  {item.body}
                </p>
              </div>
            </section>
          ) : null}

          <section style={{ padding: "96px 0 104px" }}>
            <div className="d-wrap">
              <div className="d-dark" style={{ borderRadius: 6, padding: 52 }}>
                <h2 className="d-h2" style={{ maxWidth: "20ch" }}>This is what the network sounds like</h2>
                <p className="d-lead" style={{ marginTop: 14, maxWidth: "46ch" }}>
                  Most of what happens here is between members, in their own
                  cities.
                </p>
                <div style={{ marginTop: 30 }}>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">
                    Request an invitation <Arrow />
                  </Link>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                <Link className="d-btn d-btn-line d-shine" href={`/watch/share?item=${slug}`}>
                  Share this
                </Link>
                {item.show_slug ? (
                  <Link className="d-btn d-btn-line d-shine" href={`/watch/show/${item.show_slug}`}>
                    The whole show
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(user)} nav="/watch" active="/watch">
        <section className="sec">
          <Crumbs trail={[["Watch and Listen", "/watch"]]} />
          <h1>{item.title}</h1>
          <p className="lead">{item.summary}</p>
          <p>
            <span className="chip">{item.kind}</span>{" "}
            {item.duration ? <span className="chip">{item.duration}</span> : null}{" "}
            {item.member_only ? <span className="chip">Members only</span> : null}
          </p>
          {item.external_url ? (
            <p>
              <a
                className="btn btn-primary"
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
              >
                {item.kind === "episode" ? "Listen" : "Watch"}
              </a>
            </p>
          ) : null}
        </section>

        {item.body ? (
          <section className="sec">
            <div className="panel" style={{ maxWidth: 760 }}>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.body}</p>
            </div>
          </section>
        ) : null}

        {user ? null : (
          <section className="sec">
            <div className="sec">
              <h2>This is what the network sounds like</h2>
              <p style={{ color: "#fff" }}>
                Most of what happens here is between members, in their own
                cities.
              </p>
              <Link className="btn btn-ghost" href="/apply">
                Request an invitation
              </Link>
            </div>
          <section className="sec">
          <div className="row">
            <Link className="btn btn-ghost" href={`/watch/share?item=${slug}`}>
              Share this
            </Link>
            {item.show_slug ? (
              <Link className="btn btn-ghost" href={`/watch/show/${item.show_slug}`}>
                The whole show
              </Link>
            ) : null}
          </div>
        </section>

        </section>
        )}
      </DualPage>
        );
}
