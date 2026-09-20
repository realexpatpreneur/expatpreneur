import { WorkspaceShell } from "@/components/workspace-shell";
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

  return (
    <WorkspaceShell kind="member" nav="/media">
        <section className="band">
          <p className="muted small">
            <Link href="/media">Media</Link>
          </p>
          <p>
            <span className="chip">{kindLabel[article.kind] ?? article.kind}</span>{" "}
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {article.member_only ? <span className="chip sun">Members only</span> : null}
          </p>
          <h1>{article.title}</h1>
          {article.standfirst ? <p className="lead">{article.standfirst}</p> : null}
        </section>

        {article.cover_url ? (
          <section className="band">
            <div className="shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.cover_url} alt="" />
            </div>
          </section>
        ) : null}

        <section className="band">
          <div className="cols">
            <div className="panel">
              <div style={{ whiteSpace: "pre-wrap" }}>{article.body}</div>
            </div>

            <div className="stack">
              {about ? (
                <div className="panel">
                  <h3>The member</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <b>{about.full_name}</b>
                    {about.headline ? `. ${about.headline}` : ""}
                  </p>
                  {about.public_profile || me ? (
                    <Link className="btn" href={`/members/${about.id}`}>
                      Their profile
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {me ? (
                <div className="panel wash">
                  <h3>There is a story here</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    If you know one worth telling, say so.
                  </p>
                  <Link className="btn" href="/media/suggest">
                    Suggest a story
                  </Link>
                </div>
              ) : (
                <div className="panel wash">
                  <h3>Join them</h3>
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
      </WorkspaceShell>
  );
}