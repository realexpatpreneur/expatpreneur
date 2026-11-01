import { WorkspaceShell } from "@/components/workspace-shell";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";
import { Lock } from "@/components/lock";
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
      .select("id, full_name, headline, village_id, avatar_url")
      .eq("id", post.author_id)
      .maybeSingle(),
    supabase
      .from("ask_replies")
      .select("id, body, author_id, created_at, mentions")
      .eq("ask_id", id)
      .order("created_at"),
  ]);

  // Everybody a reply names, plus everybody who wrote one, in one read.
  const mentionedIds = (replies ?? []).flatMap(
    (r: { mentions?: string[] | null }) => r.mentions ?? []
  );
  const replyAuthorIds = [
    ...new Set([
      ...(replies ?? []).map((r) => r.author_id),
      ...mentionedIds,
    ]),
  ];
  const { data: replyAuthors } = replyAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, avatar_url")
        .in("id", replyAuthorIds)
    : { data: [] };

  // Who this reply could point at: the members of the Village it is in.
  const { data: neighbours } = member.village_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .eq("village_id", member.village_id)
        .eq("status", "active")
        .neq("id", member.id)
        .order("full_name")
        .limit(100)
    : { data: [] };

  const sameVillage =
    !author?.village_id || author.village_id === member.village_id;
  const canReply = sameVillage || isPaid(member);
  const mine = post.author_id === member.id;

  const offer = post.kind === "offer";
  const intro = post.kind === "introduction";
  const kindName = intro ? "Introduction" : offer ? "Offer" : "Ask";
  const resolved = post.status === "resolved";

  const replyCount = (replies ?? []).length;
  const tag = intro ? "introduction" : offer ? "offer" : "ask";

  return (
    <WorkspaceShell kind="member">
      <nav className="m-crumb" aria-label="Breadcrumb">
        <Link href="/my-village">{member.villageName ? `${member.villageName} Village` : "Your Village"}</Link>
        <span>/</span>
        <Link href="/my-village">Ask &amp; Offer</Link>
        <span>/</span>
        <span>{kindName}</span>
      </nav>

      <div className="m-vgrid" style={{ marginTop: 0 }}>
        <div style={{ minWidth: 0 }}>
          <article>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span className={`m-tag ${tag}`} style={{ padding: "0 10px" }}>{kindName}</span>
              <span className="m-kind" style={{ color: resolved ? "#6B7683" : "#24675A" }}>
                {resolved ? "Resolved" : "Open"}
              </span>
              {post.category ? <span className="m-muted" style={{ fontSize: 13 }}>{post.category}</span> : null}
              <span className="m-muted" style={{ fontSize: 13 }}>
                {post.reach === "all_villages" ? "All Villages" : member.villageName ?? "Your Village"}
              </span>
            </div>

            <h1 style={{ margin: "14px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.15 }}>
              {post.title}
            </h1>

            <Link className="m-row" href={mine ? "/me" : `/members/${post.author_id}`} style={{ marginTop: 18, gridTemplateColumns: "56px minmax(0,1fr)", borderTop: 0 }}>
              <Av name={author?.full_name ?? "A member"} className="av-lg" src={author?.avatar_url ?? null} />
              <span>
                <b style={{ display: "block", fontSize: 15 }}>{author?.full_name ?? "A member"}</b>
                <span className="m-muted">
                  {author?.headline ? `${author.headline}, ` : ""}
                  {timeAgo(post.created_at)}
                </span>
              </span>
            </Link>

            <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: "#3B4650", whiteSpace: "pre-wrap", maxWidth: "66ch" }}>
              {post.body}
            </p>

            {resolved && post.outcome ? (
              <div className="flag ok" style={{ marginTop: 20 }}>
                <Ic name="check" />
                <span>Outcome: {post.outcome}</span>
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {!mine && canReply ? (
                <Link className="btn btn-primary" href={`/messages/${post.author_id}`} style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
                  Message {(author?.full_name ?? "them").split(" ")[0]}
                </Link>
              ) : null}
              <Link className="btn btn-ghost" href={`/report?ask=${post.id}`} style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
                Report
              </Link>
            </div>
            {mine && !resolved ? (
              <div style={{ marginTop: 24, maxWidth: 560 }}>
                <CloseForm askId={post.id} />
              </div>
            ) : null}
          </article>

          <h2 className="m-h2" style={{ marginTop: 48 }}>
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </h2>
          <div style={{ marginTop: 12, borderTop: "2px solid #0F1419" }}>
            {replyCount ? (
              (replies ?? []).map((r) => {
                const them = replyAuthors?.find((a) => a.id === r.author_id);
                const who = them?.full_name ?? "A member";
                return (
                  <div className="m-post" key={r.id}>
                    <Av name={who} src={them?.avatar_url ?? null} />
                    <div style={{ minWidth: 0 }}>
                      <div className="m-meta">
                        <b>{who}</b>
                        {them?.headline ? <span className="m-muted">{them.headline}</span> : null}
                        <span className="m-muted">{timeAgo(r.created_at)}</span>
                      </div>
                      <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
                      {(r.mentions ?? []).length ? (
                        <div className="m-acts">
                          <span className="m-muted" style={{ fontSize: 13 }}>Pointing at</span>
                          {(r.mentions ?? []).map((whoId: string) => {
                            const named = replyAuthors?.find((a) => a.id === whoId);
                            if (!named) return null;
                            return (
                              <Link key={whoId} className="m-act" href={`/members/${named.id}`}>
                                <Av name={named.full_name} className="av-sm" src={named.avatar_url ?? null} />
                                {named.full_name}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="m-muted" style={{ margin: "16px 0 0", fontSize: 15 }}>
                No replies yet.
              </p>
            )}
          </div>

          {resolved ? null : canReply ? (
            <div className="m-card" style={{ marginTop: 24 }}>
              <ReplyForm askId={post.id} people={neighbours ?? []} />
            </div>
          ) : (
            <Lock
              style={{ marginTop: 24 }}
              note="Replying across Villages is part of Village Membership."
              cta="See Village Membership"
            >
              This is from another Village
            </Lock>
          )}
        </div>

        <aside style={{ display: "grid", gap: 20 }}>
          <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
            <h3>Tips</h3>
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
              Introductions work best with a short reason. Move to a private
              message for the details.
            </p>
          </div>
          <Link className="m-ulink" href="/my-village" style={{ justifySelf: "start", fontSize: 14 }}>
            Back to Ask &amp; Offer
          </Link>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
