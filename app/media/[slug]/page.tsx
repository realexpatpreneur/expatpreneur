import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { Arrow } from "@/components/design/parts";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

const kindLabel: Record<string, string> = {
  story: "Member story",
  guide: "Guide",
  note: "Note",
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const me = await whoIsHere();

  // A members-only piece simply does not come back for a stranger, so
  // there is nothing here to get wrong.
  const { data: article } = await supabase
    .from("articles")
    .select("id, slug, kind, title, standfirst, body, cover_url, about_id, village_id, member_only, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) notFound();

  const [{ data: about }, { data: village }] = await Promise.all([
    article.about_id
      ? supabase
          .from("profiles")
          .select("id, full_name, headline, public_profile")
          .eq("id", article.about_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    article.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", article.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!me) {
    const stamp = {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase" as const,
    };

    return (
      <PublicPage active="/media">
        <div className="d-page">
          <section style={{ padding: "56px 0 44px" }}>
            <div className="d-wrap">
              <Link className="d-ulink" href="/media" style={{ fontSize: 14 }}>
                Media
              </Link>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginTop: 36 }}>
                <span style={{ ...stamp, color: "#4074AE" }}>
                  {kindLabel[article.kind] ?? article.kind}
                </span>
                {village?.name ? (
                  <span style={{ ...stamp, color: "#6B7683" }}>{village.name}</span>
                ) : null}
                {article.member_only ? (
                  <span style={{ ...stamp, color: "#8A5520" }}>Members only</span>
                ) : null}
              </div>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "24ch" }}>
                {article.title}
              </h1>
              {article.standfirst ? (
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch", fontSize: 20 }}>
                  {article.standfirst}
                </p>
              ) : null}
            </div>
          </section>

          {article.cover_url ? (
            <section style={{ paddingBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover_url}
                alt=""
                style={{ width: "100%", height: "clamp(280px, 46vw, 620px)", objectFit: "cover" }}
              />
            </section>
          ) : null}

          <section style={{ padding: "72px 0 104px" }}>
            <div className="d-wrap d-media" style={{ gap: 64 }}>
              <div
                className="d-body"
                style={{ whiteSpace: "pre-wrap", maxWidth: "68ch", fontSize: 18, lineHeight: 1.75 }}
              >
                {article.body}
              </div>

              <div>
                {about ? (
                  <div className="d-card-paper" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>The member</h3>
                    <p className="d-body" style={{ marginTop: 10 }}>
                      <b style={{ color: "#0F1419" }}>{about.full_name}</b>
                      {about.headline ? `. ${about.headline}` : ""}
                    </p>
                    {about.public_profile || me ? (
                      <Link
                        className="d-btn d-btn-sm d-btn-line d-shine"
                        href={`/members/${about.id}`}
                        style={{ marginTop: 20 }}
                      >
                        Their profile
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                <div className="d-inkbox" style={{ padding: 32, marginTop: about ? 24 : 0 }}>
                  <h3 className="d-h2 d-light" style={{ fontSize: 24 }}>Join them</h3>
                  <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.6, color: "#B9C3CD" }}>
                    Membership is by invitation.
                  </p>
                  <div style={{ marginTop: 24 }}>
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
    <DualPage member={Boolean(me)} nav="/media" active="/media">
        <section className="sec">
          <p className="muted small">
            <Link href="/media">Media</Link>
          </p>
          <p>
            <span className="chip">{kindLabel[article.kind] ?? article.kind}</span>{" "}
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {article.member_only ? <span className="chip chip-sun">Members only</span> : null}
          </p>
          <h1>{article.title}</h1>
          {article.standfirst ? <p className="lead">{article.standfirst}</p> : null}
        </section>

        {article.cover_url ? (
          <section className="sec">
            <div className="shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.cover_url} alt="" />
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <div style={{ whiteSpace: "pre-wrap" }}>{article.body}</div>
            </div>

            <div className="stack">
              {about ? (
                <div className="panel">
                  <h3>The member</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    <b>{about.full_name}</b>
                    {about.headline ? `. ${about.headline}` : ""}
                  </p>
                  {about.public_profile || me ? (
                    <Link className="btn btn-ghost" href={`/members/${about.id}`}>
                      Their profile
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {me ? (
                <div className="panel panel-wash">
                  <h3>There is a story here</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    If you know one worth telling, say so.
                  </p>
                  <Link className="btn btn-ghost" href="/media/suggest">
                    Suggest a story
                  </Link>
                </div>
              ) : (
                <div className="panel panel-wash">
                  <h3>Join them</h3>
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
