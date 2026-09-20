import { WorkspaceShell } from "@/components/workspace-shell";
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

  return (
    <WorkspaceShell kind="member" nav="/media">
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
            <p className="muted small" style={{ marginTop: 6 }}>
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
              <p className="muted small" style={{ marginTop: 6 }}>
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
              Membership is by invitation and costs nothing.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>
            </p>
          </section>
        )}
      </WorkspaceShell>
  );
}