import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { MessageForm } from "../forms";

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
    .select("id, full_name, headline, village_id")
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
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/messages">Messages</Link>
          </p>
          <h1>{person.full_name}</h1>
          <p className="lead">{person.headline}</p>
          <p>
            <Link className="btn" href={`/members/${person.id}`}>
              See their profile
            </Link>
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                {thread.length === 0 ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Nothing said yet.
                  </p>
                ) : (
                  <div className="rows">
                    {thread.map((message) => (
                      <div className="rowlink" key={message.id}>
                        <div>
                          <b>
                            {message.sender_id === member.id
                              ? "You"
                              : person.full_name}
                          </b>
                          <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div>
                          <div className="muted small">
                            {timeAgo(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                {canWrite ? (
                  <MessageForm recipientId={person.id} />
                ) : (
                  <>
                    <h3>Not open yet</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {connection?.status === "pending"
                        ? "Your request is with them. You can write once they accept."
                        : "Members in other Villages are reached through a request, on the paid plan."}
                    </p>
                    <Link className="btn" href={`/members/${person.id}`}>
                      Go to their profile
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="panel wash">
              <h3>How messages work here</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Inside a Village, members write to each other directly. Across
                Villages, the person decides first, and the paid plan is what
                allows the request. Nobody is pitched at without asking.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}