import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ConnectionDecision } from "./forms";

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
        .select("id, full_name, headline, village_id")
        .in("id", peopleIds)
    : { data: [] };

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Messages</h1>
          <p className="lead">
            Members in your Village can write to you directly. Members elsewhere
            ask first.
          </p>
        </section>

        {(requests ?? []).length ? (
          <section className="band">
            <h2>Requests to connect</h2>
            <div className="rows">
              {(requests ?? []).map((request) => (
                <div className="rowlink" key={request.id}>
                  <div>
                    <b>{nameOf(request.requester_id)}</b>
                    <div className="muted small">{request.reason}</div>
                  </div>
                  <div className="rowmeta">
                    <ConnectionDecision requestId={request.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="band">
          {threads.size === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                No messages yet. Start from someone's profile in the Directory.
              </p>
            </div>
          ) : (
            <div className="rows">
              {[...threads.entries()].map(([id, thread]) => (
                <Link className="rowlink" key={id} href={`/messages/${id}`}>
                  <div>
                    <b>{nameOf(id)}</b>
                    <div className="muted small">
                      {thread.body.slice(0, 90)}
                      {thread.body.length > 90 ? "..." : ""}
                    </div>
                  </div>
                  <div className="rowmeta">
                    {thread.unread ? <span className="chip blue">New</span> : null}
                    <span className="chip">{timeAgo(thread.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}