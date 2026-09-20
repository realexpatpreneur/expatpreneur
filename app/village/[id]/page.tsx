import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { ReplyForm, CloseForm } from "../forms";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember("/village");
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("asks")
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
      .from("ask_replies")
      .select("id, body, author_id, created_at")
      .eq("ask_id", id)
      .order("created_at"),
  ]);

  const replyAuthorIds = [...new Set((replies ?? []).map((r) => r.author_id))];
  const { data: replyAuthors } = replyAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", replyAuthorIds)
    : { data: [] };

  const sameVillage =
    !author?.village_id || author.village_id === member.village_id;
  const canReply = sameVillage || isPaid(member);
  const mine = post.author_id === member.id;

  return (
    <WorkspaceShell kind="member" nav="/village">
        <section className="band">
          <p className="muted small">
            <Link href="/village">Ask &amp; Offer</Link>
          </p>
          <p>
            <span className={`chip ${post.kind === "offer" ? "mint" : "blue"}`}>
              {post.kind === "offer" ? "Offer" : "Ask"}
            </span>{" "}
            {post.category ? <span className="chip">{post.category}</span> : null}{" "}
            {post.reach === "all_villages" ? (
              <span className="chip">Every Village</span>
            ) : null}
          </p>
          <h1>{post.title}</h1>
          <p className="muted small">
            <Link href={`/members/${post.author_id}`}>
              {author?.full_name ?? "A member"}
            </Link>
            {author?.headline ? `, ${author.headline}` : ""}.{" "}
            {timeAgo(post.created_at)}.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
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
                    {(replies ?? []).map((reply) => {
                      const who = replyAuthors?.find((a) => a.id === reply.author_id);
                      return (
                        <div className="rowlink" key={reply.id}>
                          <div>
                            <b>{who?.full_name ?? "A member"}</b>
                            <div style={{ whiteSpace: "pre-wrap" }}>{reply.body}</div>
                            <div className="muted small">
                              {timeAgo(reply.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  {post.status !== "open" ? (
                    <p className="muted small">
                      This post is closed. {post.outcome}
                    </p>
                  ) : canReply ? (
                    <ReplyForm askId={id} />
                  ) : (
                    <div className="panel wash">
                      <h3>Replying across Villages is part of the paid plan</h3>
                      <p className="muted small">
                        You can read every post. Answering a member in another
                        Village, and messaging them, comes with paid membership.
                      </p>
                      <Link className="btn" href="/upgrade">
                        See the paid plan
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {mine && post.status === "open" ? <CloseForm askId={id} /> : null}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Posted by</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {author?.full_name}
                  {author?.headline ? `, ${author.headline}` : ""}
                </p>
                <Link className="btn" href={`/members/${post.author_id}`}>
                  See their profile
                </Link>
              </div>
              <div className="panel wash">
                <h3>How this works</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Answer if you can help. Nobody pitches here. When something
                  gets sorted, the person who asked closes the post and says
                  what happened.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}