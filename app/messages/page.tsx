import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { ConnectionDecision } from "./forms";
import { Av } from "@/components/bits";

export const metadata = { title: "Messages, ExpatPreneurs Global" };

export default async function MessagesPage() {
  const member = await requireMember("/messages");
  const supabase = await createClient();

  const [{ data: messages }, { data: requests }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("connection_requests")
      .select("id, requester_id, recipient_id, reason, status, created_at")
      .eq("recipient_id", member.id)
      .eq("status", "pending"),
  ]);

  // One row per person, showing the latest thing said either way.
  const threads = new Map<
    string,
    { body: string; created_at: string; unread: boolean }
  >();
  for (const message of messages ?? []) {
    const other =
      message.sender_id === member.id ? message.recipient_id : message.sender_id;
    if (!threads.has(other)) {
      threads.set(other, {
        body: message.body,
        created_at: message.created_at,
        unread: message.recipient_id === member.id && !message.read_at,
      });
    }
  }

  const peopleIds = [
    ...new Set([...threads.keys(), ...(requests ?? []).map((r) => r.requester_id)]),
  ];
  const { data: people } = peopleIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, village_id, avatar_url")
        .in("id", peopleIds)
    : { data: [] };

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";
  const faceOf = (id: string) => people?.find((p) => p.id === id)?.avatar_url ?? null;

  return (
    <WorkspaceShell kind="member" nav="/messages">
        <section className="sec">
          <h1>Messages</h1>
          <p className="lead">
            Members in your Village can write to you directly. Members elsewhere
            ask first.
          </p>
        </section>

        {(requests ?? []).length ? (
          <section className="sec">
            <h2>Requests to connect</h2>
            <div className="m-threads">
              {(requests ?? []).map((request) => (
                <div className="m-thread" key={request.id}>
                  <Av name={nameOf(request.requester_id)} className="av-lg" src={faceOf(request.requester_id)} />
                  <div style={{ minWidth: 0 }}>
                    <b>{nameOf(request.requester_id)}</b>
                    <span className="m-muted">{request.reason}</span>
                  </div>
                  <div className="rowmeta">
                    <ConnectionDecision requestId={request.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          {threads.size === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                No messages yet. Start from someone's profile in the Directory.
              </p>
            </div>
          ) : (
            <div className="m-threads">
              {[...threads.entries()].map(([id, thread]) => (
                <Link className={`m-thread ${thread.unread ? "unread" : ""}`} key={id} href={`/messages/${id}`}>
                  <Av name={nameOf(id)} className="av-lg" src={faceOf(id)} />
                  <div style={{ minWidth: 0 }}>
                    <b>{nameOf(id)}</b>
                    <span className="m-muted">
                      {thread.body.slice(0, 90)}
                      {thread.body.length > 90 ? "..." : ""}
                    </span>
                  </div>
                  <div className="m-status">
                    {thread.unread ? <span className="m-kind m-offer">New</span> : null}
                    <small>{timeAgo(thread.created_at)}</small>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}