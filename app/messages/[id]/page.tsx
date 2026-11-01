import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { MessageForm } from "../forms";
import { Av } from "@/components/bits";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember("/messages");
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("profiles")
    .select("id, full_name, headline, village_id, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!person) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
    .order("created_at");

  const thread = (messages ?? []).filter(
    (m) =>
      (m.sender_id === member.id && m.recipient_id === id) ||
      (m.sender_id === id && m.recipient_id === member.id)
  );

  // Mark what they sent as read.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", id)
    .eq("recipient_id", member.id)
    .is("read_at", null);

  const sameVillage = person.village_id === member.village_id;
  const { data: connection } = sameVillage
    ? { data: null }
    : await supabase
        .from("connection_requests")
        .select("status")
        .or(
          `and(requester_id.eq.${member.id},recipient_id.eq.${id}),and(requester_id.eq.${id},recipient_id.eq.${member.id})`
        )
        .maybeSingle();

  const canWrite =
    sameVillage || (isPaid(member) && connection?.status === "accepted");

  return (
    <WorkspaceShell kind="member" nav="/messages">
      <nav className="m-crumb" aria-label="Breadcrumb">
        <Link href="/messages">Messages</Link>
        <span>/</span>
        <span>{person.full_name}</span>
      </nav>

      <div className="m-vgrid" style={{ marginTop: 0 }}>
        <div style={{ minWidth: 0 }}>
          <Link className="m-row" href={`/members/${person.id}`} style={{ gridTemplateColumns: "64px minmax(0,1fr) auto", borderTop: 0, paddingTop: 0 }}>
            <Av name={person.full_name} className="av-lg" src={person.avatar_url ?? null} />
            <span>
              <b style={{ display: "block", fontSize: 24, fontWeight: 800, letterSpacing: "-.025em" }}>{person.full_name}</b>
              {person.headline ? <span className="m-muted" style={{ fontSize: 15 }}>{person.headline}</span> : null}
            </span>
            <span className="m-ulink" style={{ fontSize: 14 }}>Their profile</span>
          </Link>

          <div className="m-chat">
            {thread.length === 0 ? (
              <p className="m-muted" style={{ margin: 0, fontSize: 15 }}>
                Nothing said yet.
              </p>
            ) : (
              thread.map((message) => {
                const mineMsg = message.sender_id === member.id;
                return (
                  <div className={`m-bubble ${mineMsg ? "me" : ""}`} key={message.id}>
                    <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div>
                    <small>{mineMsg ? "You" : person.full_name.split(" ")[0]}, {timeAgo(message.created_at)}</small>
                  </div>
                );
              })
            )}
          </div>

          <div className="m-card" style={{ marginTop: 20 }}>
            {canWrite ? (
              <MessageForm recipientId={person.id} />
            ) : (
              <>
                <h3>Not open yet</h3>
                <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
                  {connection?.status === "pending"
                    ? "Your request is with them. You can write once they accept."
                    : "Members in other Villages are reached through a request, with Village Membership."}
                </p>
                <Link className="btn btn-ghost btn-sm" href={`/members/${person.id}`} style={{ marginTop: 12 }}>
                  Go to their profile
                </Link>
              </>
            )}
          </div>
        </div>

        <aside>
          <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
            <h3>How messages work here</h3>
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
              Inside a Village, members write to each other directly. Across
              Villages, the person decides first, and Village Membership is what
              allows the request. Nobody is pitched at without asking.
            </p>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
