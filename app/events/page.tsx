import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { whenText, priceText, registrationBlock, type EventRow } from "@/lib/events";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Events, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await requireMember("/events");
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("event_id, status")
    .eq("profile_id", member.id);

  const registeredFor = new Set(
    (registrations ?? [])
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.event_id)
  );

  const rows = ((events ?? []) as EventRow[]).filter((event) => {
    if (show === "mine") return registeredFor.has(event.id);
    if (show === "village") return event.village_id === member.village_id;
    return true;
  });

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Events</h1>
          <p className="lead">
            Gatherings in your Village, in other Villages and online.
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["village", "My Village"],
              ["mine", "I am going"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/events?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          {rows.length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing on the calendar yet.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {rows.map((event, i) => {
                const blocked = registrationBlock(event, member);
                return (
                  <article className="card" key={event.id}>
                    <Link href={`/events/${event.slug}`}>
                      <div className={`cover ${covers[i % covers.length]}`}>
                        {event.title}
                      </div>
                      <div className="kind">{whenText(event)}</div>
                      <p>{event.venue ?? (event.is_online ? "Online" : "")}</p>
                      <div className="meta">
                        {registeredFor.has(event.id) ? (
                          <span className="chip mint">You are going</span>
                        ) : blocked ? (
                          <span className="chip sun">{blocked}</span>
                        ) : (
                          <span className="chip">{priceText(event)}</span>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}