import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { PageBlocks } from "@/components/page-blocks";
import { Arrow, Faces, PHOTO } from "@/components/design/parts";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SubscribeForm } from "./subscribe-form";

export const metadata = {
  title: "Media, ExpatPreneurs Global",
  description:
    "Stories about members building a business away from home, and what they learned doing it.",
};

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

// Photographs for pieces that have no cover of their own yet.
const COVERS = [PHOTO.table, PHOTO.ines, PHOTO.members, PHOTO.julien, PHOTO.kristiane, PHOTO.reader];

const kindLabel: Record<string, string> = {
  story: "Member story",
  guide: "Guide",
  note: "Note",
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "" } = await searchParams;
  const supabase = await createClient();
  const me = await whoIsHere();

  let query = supabase
    .from("articles")
    .select("id, slug, kind, title, standfirst, cover_url, member_only, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  if (kind) query = query.eq("kind", kind);

  const { data: articles } = await query;

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!me) {
    const list = articles ?? [];
    const lead = list[0] ?? null;
    const rest = list.filter((a) => a !== lead);
    const cover = (a: { cover_url: string | null }, i: number) =>
      a.cover_url ?? COVERS[i % COVERS.length];

    return (
      <PublicPage active="/media">
        <PageBlocks data={{ articles: articles ?? [] }} slug="media">
          <div className="d-page">
            <section style={{ padding: "64px 0 44px" }}>
              <div className="d-wrap">
                <h1 className="d-h1">Media</h1>
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                  Stories about members building a business away from home, and what
                  they learned doing it.
                </p>
              </div>
            </section>

            <div className="d-wrap">
              <nav className="d-tabs" aria-label="Kind">
                <Link className={kind ? "" : "on"} href="/media">
                  Everything
                </Link>
                <Link className={kind === "story" ? "on" : ""} href="/media?kind=story">
                  Member stories
                </Link>
                <Link className={kind === "guide" ? "on" : ""} href="/media?kind=guide">
                  Guides
                </Link>
                <Link className={kind === "note" ? "on" : ""} href="/media?kind=note">
                  Notes
                </Link>
              </nav>
            </div>

            <section style={{ padding: "56px 0 96px" }}>
              <div className="d-wrap">
                {list.length === 0 ? (
                  <p className="d-body">Nothing published here yet.</p>
                ) : (
                  <>
                    {lead ? (
                      <Link className="d-feature" href={`/media/${lead.slug}`}>
                        <span className="d-fimg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cover(lead, 0)} alt="" />
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", padding: 36 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6B7683" }}>
                            {kindLabel[lead.kind] ?? lead.kind}
                          </span>
                          <span className="d-body" style={{ display: "block", marginTop: 20, fontSize: 17, lineHeight: 1.55 }}>
                            <b style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-.025em", color: "#0F1419" }}>{lead.title}</b>
                            {lead.standfirst ? `. ${lead.standfirst}` : ""}
                          </span>
                          {lead.member_only ? (
                            <span className="d-small" style={{ display: "block", marginTop: "auto", paddingTop: 24, fontSize: 13 }}>
                              Members only
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    ) : null}

                    <div style={{ marginTop: lead && rest.length ? 56 : 0 }}>
                      {rest.map((article, i) => (
                        <Link className="d-mrow" href={`/media/${article.slug}`} key={article.id}>
                          <span className="d-thumb" style={{ height: 86 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cover(article, i + 1)} alt="" />
                          </span>
                          <span>
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7683" }}>
                              {kindLabel[article.kind] ?? article.kind}
                            </span>
                            <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 15 }}>
                              <b style={{ color: "#0F1419" }}>{article.title}</b>
                              {article.standfirst ? `. ${article.standfirst}` : ""}
                            </span>
                            {article.member_only ? (
                              <span className="d-small" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                                Members only
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="d-sec d-washed">
              <div className="d-wrap">
                <div className="d-boxed d-form" style={{ maxWidth: 640, background: "#FFFFFF" }}>
                  <h2 className="d-h2" style={{ fontSize: 28 }}>The newsletter</h2>
                  <p className="d-body" style={{ marginTop: 12, fontSize: 16, maxWidth: "52ch" }}>
                    Member stories and what is opening where, once a month. Members
                    can switch it off in their settings, and anybody can
                    unsubscribe from the email itself.
                  </p>
                  <div style={{ marginTop: 24 }}>
                    <SubscribeForm source="media" />
                  </div>
                </div>
              </div>
            </section>

            <section className="d-sec">
              <div className="d-wrap">
                <div className="d-dark" style={{ borderRadius: 6, padding: 52, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                  <div style={{ flex: "1 1 440px", minWidth: 0 }}>
                    <span style={{ display: "block", marginBottom: 22 }}>
                      <Faces srcs={[PHOTO.ines, PHOTO.tomas, PHOTO.julien]} size={48} />
                    </span>
                    <h2 className="d-h2">The people in these stories are members</h2>
                    <p className="d-lead" style={{ marginTop: 12 }}>
                      Membership is by invitation.
                    </p>
                  </div>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">
                    Request an invitation <Arrow />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </PageBlocks>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(me)} nav="/media" active="/media">
      <PageBlocks data={{ articles: articles ?? [] }} slug="media">
        <section className={me ? "sec" : "pubsec hero-center"}>
          <h1>Media</h1>
          <p className="lead">
            Stories about members building a business away from home, and what
            they learned doing it.
          </p>
          <div className="tabs">
            <Link className={`chip ${kind ? "" : "chip-mint"}`} href="/media">
              Everything
            </Link>
            <Link
              className={`chip ${kind === "story" ? "chip-mint" : ""}`}
              href="/media?kind=story"
            >
              Member stories
            </Link>
            <Link
              className={`chip ${kind === "guide" ? "chip-mint" : ""}`}
              href="/media?kind=guide"
            >
              Guides
            </Link>
            <Link
              className={`chip ${kind === "note" ? "chip-mint" : ""}`}
              href="/media?kind=note"
            >
              Notes
            </Link>
          </div>
        </section>

        <section className="sec">
          {(articles ?? []).length === 0 ? (
            <p className="muted">Nothing published here yet.</p>
          ) : (
            <div className="g3 g4">
              {(articles ?? []).map((article, i) => (
                <Link className="card" href={`/media/${article.slug}`} key={article.id}>
                  {article.cover_url ? (
                    <div className="cover photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.cover_url} alt="" />
                    </div>
                  ) : (
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {article.title}
                    </div>
                  )}
                  <div className="kind">{kindLabel[article.kind] ?? article.kind}</div>
                  <p>
                    <b>{article.title}</b>
                    {article.standfirst ? `. ${article.standfirst}` : ""}
                  </p>
                  {article.member_only ? (
                    <div className="meta">
                      <span className="chip">Members only</span>
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="sec">
          <div className="panel panel-wash" style={{ maxWidth: 520 }}>
            <h3>The newsletter</h3>
            <p className="muted small" style={{ marginTop: 8 }}>
              Member stories and what is opening where, once a month. Members
              can switch it off in their settings, and anybody can
              unsubscribe from the email itself.
            </p>
            <SubscribeForm source="media" />
          </div>
        </section>

        {me ? (
          <section className="sec">
            <div className="panel panel-wash">
              <h3>There is a story here</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                Something you did, something another member did, or something
                two of you did together. Tell the team about it.
              </p>
              <Link className="btn btn-ghost" href="/media/suggest">
                Suggest a story
              </Link>
            </div>
          </section>
        ) : (
          <section className="sec">
            <h2>The people in these stories are members</h2>
            <p className="lead">
              Membership is by invitation.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>
            </p>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
