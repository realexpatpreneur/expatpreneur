import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { MarketReplyForm, CloseMarketForm } from "../forms";
import { stageLabel } from "../page";

export default async function MarketPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember("/market-exploration");
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("market_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  const [{ data: author }, { data: replies }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, village_id")
      .eq("id", post.author_id)
      .maybeSingle(),
    supabase
      .from("market_replies")
      .select("id, body, author_id, created_at")
      .eq("post_id", id)
      .order("created_at"),
  ]);

  const replyAuthorIds = [...new Set((replies ?? []).map((r) => r.author_id))];
  const { data: replyAuthors } = replyAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", replyAuthorIds)
    : { data: [] };

  const sameVillage =
    !author?.village_id || author.village_id === member.village_id;
  const canReply = sameVillage || isPaid(member);

  return (
    <WorkspaceShell kind="member" nav="/market-exploration">
        <section className="band">
          <p className="muted small">
            <Link href="/market-exploration">Market Exploration</Link>
          </p>
          <p>
            <span className="chip blue">
              {post.city ? `${post.city}, ` : ""}
              {post.country}
            </span>{" "}
            <span className="chip">{post.industry}</span>{" "}
            <span className="chip mint">{stageLabel[post.stage] ?? post.stage}</span>
          </p>
          <h1>{post.title}</h1>
          <p className="muted small">
            <Link href={`/members/${post.author_id}`}>
              {author?.full_name ?? "A member"}
            </Link>
            . {timeAgo(post.created_at)}.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
            {post.author_id === member.id && post.status === "open" ? (
              <div className="panel">
                <h3>Done with this one?</h3>
                <CloseMarketForm postId={id} />
              </div>
            ) : null}

              {post.status === "resolved" ? (
                <div className="panel wash">
                  <h3>Closed</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {post.outcome ?? "The person who asked has what they needed."}
                  </p>
                </div>
              ) : null}

              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{post.body}</p>
              </div>

              <div className="panel">
                <h3>
                  {(replies ?? []).length}{" "}
                  {(replies ?? []).length === 1 ? "reply" : "replies"}
                </h3>
                {(replies ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Nobody has answered yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(replies ?? []).map((reply) => (
                      <div className="rowlink" key={reply.id}>
                        <div>
                          <b>
                            {replyAuthors?.find((a) => a.id === reply.author_id)
                              ?.full_name ?? "A member"}
                          </b>
                          <div style={{ whiteSpace: "pre-wrap" }}>{reply.body}</div>
                          <div className="muted small">{timeAgo(reply.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  {canReply ? (
                    <MarketReplyForm postId={id} />
                  ) : (
                    <div className="panel wash">
                      <h3>Replying across Villages is part of the paid plan</h3>
                      <p className="muted small">
                        You can read every post here. Answering a member in
                        another Village comes with paid membership.
                      </p>
                      <Link className="btn" href="/upgrade">
                        See the paid plan
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <h3>The market</h3>
                <dl className="kv">
                  <dt>Country</dt>
                  <dd>{post.country}</dd>
                  <dt>City</dt>
                  <dd>{post.city || "Anywhere"}</dd>
                  <dt>Industry</dt>
                  <dd>{post.industry}</dd>
                  <dt>Stage</dt>
                  <dd>{stageLabel[post.stage] ?? post.stage}</dd>
                </dl>
              </div>
              <div className="panel wash">
                <h3>Who knows this market</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Search the Directory for members who have lived or sold there.
                </p>
                <Link className="btn" href={`/directory?q=${encodeURIComponent(post.country)}`}>
                  Search the Directory
                </Link>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}