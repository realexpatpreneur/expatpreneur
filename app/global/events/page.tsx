import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { whenText } from "@/lib/events";
import { timeAgo } from "@/lib/member";

export const metadata = { title: "Events, the Global team" };

export default async function GlobalEventsPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: events }, { data: villages }, { data: partners }, { data: registrations }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online, village_id, capacity, status, price_cents, currency")
        .order("starts_at", { ascending: false })
        .limit(80),
      supabase.from("villages").select("id, name"),
      supabase
        .from("partnered_events")
        .select("id, title, partner, village_id, proposed_by, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false }),
      supabase.from("event_registrations").select("event_id, status"),
    ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Online";

  const taken = (eventId: string) =>
    (registrations ?? []).filter(
      (r) => r.event_id === eventId && r.status === "confirmed"
    ).length;

  const upcoming = (events ?? []).filter(
    (e) => new Date(e.starts_at).getTime() >= Date.now() && e.status === "published"
  );
  const past = (events ?? []).filter(
    (e) => new Date(e.starts_at).getTime() < Date.now()
  );

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Events</h1>
          <p className="lead">Across the network.</p>
        </section>

        {(partners ?? []).length ? (
          <section className="band">
            <div className="panel">
              <h3>Waiting for approval</h3>
              <div className="rows" style={{ marginTop: 12 }}>
                {(partners ?? []).map((request) => (
                  <Link className="rowlink" href="/global/partners" key={request.id}>
                    <div>
                      <b>{request.title}</b>
                      <div className="muted small">
                        {villageName(request.village_id)}. Partner:{" "}
                        {request.partner}. {timeAgo(request.created_at)}
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip sun">Partnered event</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="band">
          <h2>Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="muted small">Nothing on the calendar anywhere.</p>
          ) : (
            <div className="rows" style={{ marginTop: 12 }}>
              {upcoming.map((event) => (
                <Link
                  className="rowlink"
                  href={`/admin/events/${event.id}`}
                  key={event.id}
                >
                  <div>
                    <b>{event.title}</b>
                    <div className="muted small">
                      {villageName(event.village_id)}. {whenText(event)}
                    </div>
                  </div>
                  <div className="rowmeta">
                    {event.price_cents ? (
                      <span className="chip">
                        {(event.price_cents / 100).toFixed(0)} {event.currency}
                      </span>
                    ) : null}
                    <span className="chip">
                      {taken(event.id)} of {event.capacity}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="band">
          <h2>Already happened</h2>
          {past.length === 0 ? (
            <p className="muted small">Nothing yet.</p>
          ) : (
            <div className="rows" style={{ marginTop: 12 }}>
              {past.slice(0, 25).map((event) => (
                <Link
                  className="rowlink"
                  href={`/admin/events/${event.id}`}
                  key={event.id}
                >
                  <div>
                    <b>{event.title}</b>
                    <div className="muted small">
                      {villageName(event.village_id)}. {whenText(event)}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span className={`chip ${event.status === "cancelled" ? "" : "mint"}`}>
                      {event.status === "cancelled"
                        ? "Called off"
                        : `${taken(event.id)} came`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
    </main>
  );
}