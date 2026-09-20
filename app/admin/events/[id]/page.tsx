import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { whenText, priceText, audienceText, type EventRow } from "@/lib/events";
import { DecisionButtons, CheckInButton } from "../forms";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const event = data as EventRow;

  const [{ data: registrations }, { data: village }] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("id, profile_id, guest_name, guest_email, status, is_visitor, note, checked_in_at")
      .eq("event_id", id)
      .order("created_at"),
    event.village_id
      ? supabase.from("villages").select("name").eq("id", event.village_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const memberIds = (registrations ?? [])
    .map((r) => r.profile_id)
    .filter(Boolean) as string[];
  const { data: members } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, village_id")
        .in("id", memberIds)
    : { data: [] };

  const rows = registrations ?? [];
  const waiting = rows.filter((r) => r.status === "pending");
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const checkedIn = rows.filter((r) => r.checked_in_at);
  const nameOf = (row: (typeof rows)[number]) =>
    row.guest_name ??
    members?.find((m) => m.id === row.profile_id)?.full_name ??
    "A member";

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/events">Events</Link>
        </p>
        <h1>{event.title}</h1>
        <p className="lead">
          {whenText(event)}. {event.venue ?? "Online"}. {priceText(event)}.
        </p>
        {done ? (
          <div className="notice good">
            {done === "published" ? "Event published." : "Saved."}
          </div>
        ) : null}
        <p>
          <Link className="btn" href={`/admin/events/${id}/edit`}>
            Edit
          </Link>{" "}
          {event.visibility === "public" ? (
            <Link className="btn" href={`/e/${event.slug}`}>
              See the public page
            </Link>
          ) : (
            <Link className="btn" href={`/events/${event.slug}`}>
              See the member page
            </Link>
          )}
        </p>
      </section>

      <section className="band">
        <div className="grid three">
          <div className="panel">
            <h3>Registered</h3>
            <p className="lead" style={{ margin: 0 }}>
              {confirmed.length} of {event.capacity}
            </p>
          </div>
          <div className="panel">
            <h3>Waiting for approval</h3>
            <p className="lead" style={{ margin: 0 }}>
              {waiting.length}
            </p>
          </div>
          <div className="panel">
            <h3>Checked in</h3>
            <p className="lead" style={{ margin: 0 }}>
              {checkedIn.length}
            </p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="panel">
          <h3>Who can register</h3>
          <p className="muted small" style={{ marginTop: 6 }}>
            {audienceText(event, village?.name ?? null)}.{" "}
            {event.requires_approval
              ? "Each registration waits for your approval."
              : "Registration is immediate until the event is full."}{" "}
            {event.show_guest_list
              ? "The guest list is visible to everyone who registers."
              : "The guest list stays private."}
          </p>
        </div>
      </section>

      {waiting.length ? (
        <section className="band">
          <h2>Waiting for approval</h2>
          <div className="rows">
            {waiting.map((row) => (
              <div className="rowlink" key={row.id}>
                <div>
                  <b>{nameOf(row)}</b>
                  <div className="muted small">
                    {row.guest_email ?? ""}
                    {row.note ? ` ${row.note}` : ""}
                  </div>
                </div>
                <div className="rowmeta">
                  <DecisionButtons registrationId={row.id} eventId={id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="band">
        <h2>Guest list</h2>
        {rows.length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nobody has registered yet.
            </p>
          </div>
        ) : (
          <div className="rows">
            {rows.map((row) => (
              <div className="rowlink" key={row.id}>
                <div>
                  <b>{nameOf(row)}</b>
                  <div className="muted small">
                    {row.guest_email
                      ? `Guest. ${row.guest_email}`
                      : row.is_visitor
                        ? "Visiting member"
                        : "Member"}
                    . {row.status}.
                  </div>
                </div>
                <div className="rowmeta">
                  {row.status === "confirmed" ? (
                    <CheckInButton
                      registrationId={row.id}
                      eventId={id}
                      checkedIn={Boolean(row.checked_in_at)}
                    />
                  ) : (
                    <span className="chip">{row.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}