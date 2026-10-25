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

  return (
    <WorkspaceShell kind="member">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/my-village">{member.villageName ?? "Your Village"}</Link>
        <Ic name="chev" />
        <Link href="/my-village">Ask &amp; Offer</Link>
        <Ic name="chev" />
        <span>{kindName}</span>
      </nav>

      <div className="gside">
        <div className="stack">
          <div className="panel">
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className={`kindtag ${offer || intro ? "offer" : "ask"}`}>
                {kindName}
              </span>
              <span className={`chip ${resolved ? "" : "chip-mint"}`}>
                {resolved ? "Resolved" : "Open"}
              </span>
              {post.category ? <span className="chip">{post.category}</span> : null}
              <span className="chip chip-blue">
                {post.reach === "global" ? "All Villages" : member.villageName ?? "Your Village"}
              </span>
            </div>

            <h1 style={{ fontSize: 20, marginTop: 12 }}>{post.title}</h1>

            <div className="row small muted" style={{ marginTop: 8 }}>
              <Av
                name={author?.full_name ?? "A member"}
                className="av-sm"
                src={author?.avatar_url ?? null}
              />
              <Link href={mine ? "/me" : `/members/${post.author_id}`}>
                {author?.full_name ?? "A member"}
              </Link>
              , {timeAgo(post.created_at)}
            </div>

            <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{post.body}</p>

            {resolved && post.outcome ? (
              <div className="flag ok" style={{ marginTop: 12 }}>
                <Ic name="check" />
                <span>Outcome: {post.outcome}</span>
              </div>
            ) : null}

            <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
              {mine && !resolved ? <CloseForm askId={post.id} /> : null}
              {!mine && canReply ? (
                <Link
                  className="btn btn-primary"
                  href={`/messages/${post.author_id}`}
                >
                  Message {(author?.full_name ?? "them").split(" ")[0]}
                </Link>
              ) : null}
              <Link className="btn btn-ghost" href={`/report?ask=${post.id}`}>
                Report
              </Link>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ fontSize: 14 }}>
              {(replies ?? []).length}{" "}
              {(replies ?? []).length === 1 ? "reply" : "replies"}
            </h3>
            <div className="divide" style={{ marginTop: 6 }}>
              {(replies ?? []).length ? (
                (replies ?? []).map((r) => {
                  const them = replyAuthors?.find((a) => a.id === r.author_id);
                  const who = them?.full_name ?? "A member";
                  return (
                    <div className="li" style={{ alignItems: "flex-start" }} key={r.id}>
                      <Av name={who} className="av-sm" src={them?.avatar_url ?? null} />
                      <div className="grow">
                        <b>{who}</b>
                        <p className="small" style={{ whiteSpace: "pre-wrap" }}>
                          {r.body}
                        </p>
                        {(r.mentions ?? []).length ? (
                          <p className="muted small" style={{ marginTop: 4 }}>
                            Pointing at{" "}
                            {(r.mentions ?? []).map(
                              (who: string, n: number) => {
                                const them = replyAuthors?.find(
                                  (a) => a.id === who
                                );
                                if (!them) return null;
                                return (
                                  <span key={who}>
                                    {n ? ", " : ""}
                                    <Link href={`/members/${them.id}`}>
                                      {them.full_name}
                                    </Link>
                                  </span>
                                );
                              }
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="muted small">No replies yet.</p>
              )}
            </div>

            {resolved ? null : canReply ? (
              <div style={{ marginTop: 10 }}>
                <ReplyForm askId={post.id} people={neighbours ?? []} />
              </div>
            ) : (
              <Lock
                style={{ marginTop: 10 }}
                note="Replying across Villages is part of Village Membership."
                cta="See Village Membership"
              >
                This is from another Village
              </Lock>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>Tips</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Introductions work best with a short reason. Move to a private
              message for the details.
            </p>
          </div>
          <Link className="btn btn-ghost" href="/my-village">
            Back to Ask &amp; Offer
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}