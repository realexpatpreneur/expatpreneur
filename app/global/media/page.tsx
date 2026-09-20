import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ArticleForm, SuggestionDecision } from "./forms";

export const metadata = { title: "Media, the Global team" };

export default async function GlobalMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; done?: string }>;
}) {
  const { edit, done } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: articles }, { data: villages }, { data: suggestions }] =
    await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, kind, title, standfirst, body, cover_url, about_id, village_id, member_only, status, published_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(60),
      supabase.from("villages").select("id, name").order("name"),
      supabase
        .from("story_suggestions")
        .select("id, profile_id, about, body, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const suggesterIds = [...new Set((suggestions ?? []).map((s) => s.profile_id))];
  const { data: suggesters } = suggesterIds.length
    ? await supabase
        .from("member_records")
        .select("id, full_name")
        .in("id", suggesterIds)
    : { data: [] };

  const editing = (articles ?? []).find((a) => a.id === edit);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Media</h1>
          <p className="lead">
            The stories and guides that are read, as against Watch and Listen,
            which is what is watched.
          </p>
          {done ? <div className="notice good">Saved.</div> : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <ArticleForm villages={villages ?? []} article={editing} />
              {editing ? (
                <p>
                  <Link className="btn" href="/global/media">
                    Start a new piece instead
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Everything written</h3>
                {(articles ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(articles ?? []).map((article) => (
                      <Link
                        className="rowlink"
                        href={`/global/media?edit=${article.id}`}
                        key={article.id}
                      >
                        <div>
                          <b>{article.title}</b>
                          <div className="muted small">
                            {article.kind}. {timeAgo(article.updated_at)}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${article.status === "published" ? "mint" : ""}`}
                          >
                            {article.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Stories members have suggested</h3>
                {(suggestions ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing suggested yet.
                  </p>
                ) : (
                  <div className="stack" style={{ marginTop: 12 }}>
                    {(suggestions ?? []).map((suggestion) => (
                      <div className="panel wash" key={suggestion.id}>
                        <p className="muted small">
                          {suggesters?.find((s) => s.id === suggestion.profile_id)
                            ?.full_name ?? "A member"}
                          , about {suggestion.about}. {timeAgo(suggestion.created_at)}.{" "}
                          <span className="chip">{suggestion.status}</span>
                        </p>
                        <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                          {suggestion.body}
                        </p>
                        <SuggestionDecision id={suggestion.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}