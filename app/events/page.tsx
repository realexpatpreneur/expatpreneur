import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { DualPage } from "@/components/dual-page";
import { PageHead } from "@/components/workspace-shell";
import { EventRow } from "@/components/feed";
import {
  whenText,
  priceText,
  registrationBlock,
  type EventRow as EventData,
} from "@/lib/events";

export const metadata = { title: "Events, ExpatPreneurs Global" };

// Open to everyone. A visitor sees the events that are open to the
// public; a member sees theirs, other Villages' and everything online.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  if (!member) query = query.eq("visibility", "public");

  const [{ data: events }, { data: registrations }, { data: villages }] =
    await Promise.all([
      query,
      member
        ? supabase
            .from("event_registrations")
            .select("event_id, status")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
      supabase.from("villages").select("id, name"),
    ]);

  const registeredFor = new Set(
    (registrations ?? [])
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.event_id)
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const rows = ((events ?? []) as EventData[]).filter((event) => {
    if (!member) return true;
    if (show === "mine") return registeredFor.has(event.id);
    if (show === "village") return event.village_id === member.village_id;
    if (show === "other")
      return event.village_id && event.village_id !== member.village_id;
    if (show === "online") return event.is_online;
    return true;
  });

  const FILTERS: [string, string][] = [
    ["all", "All"],
    ["village", "My Village"],
    ["other", "Other Villages"],
    ["online", "Online"],
    ["mine", "I am going"],
  ];

  return (
    <DualPage member={Boolean(member)} nav="/events" active="/events">
      {member ? (
        <PageHead
          title="Events"
          sub="Gatherings in your Village, in other Villages and online."
        />
      ) : (
        <section className="pubsec hero-center">
          <h1>Events</h1>
          <p className="intro">
            Gatherings in every Village and online. Some are open to everyone;
            most are for members.
          </p>
        </section>
      )}

      <section className={member ? "sec" : "pubsec"} style={{ paddingTop: 0 }}>
        {member ? (
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/events?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing on the calendar yet.
            </p>
          </div>
        ) : (
          <div className="divide">
            {rows.map((event) => {
              const blocked = member ? registrationBlock(event, member) : null;
              const d = new Date(event.starts_at);
              const visiting = Boolean(
                member && event.village_id && event.village_id !== member.village_id
              );
              return (
                <EventRow
                  key={event.id}
                  href={member ? `/events/${event.slug}` : `/e/${event.slug}`}
                  day={String(d.getDate())}
                  month={d.toLocaleDateString("en-GB", { month: "short" })}
                  title={event.title}
                  line={`${
                    event.village_id ? `${villageName(event.village_id)}. ` : ""
                  }${whenText(event)}${
                    event.is_online ? ", online" : event.venue ? `, ${event.venue}` : ""
                  }`}
                  visiting={visiting}
                  right={
                    registeredFor.has(event.id) ? (
                      <span className="chip chip-mint">You are going</span>
                    ) : blocked ? (
                      <span className="chip chip-sun">{blocked}</span>
                    ) : (
                      <span className="chip">{priceText(event)}</span>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {member ? null : (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="band">
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 22 }}>Most events are for members</h2>
              <p style={{ marginTop: 6 }}>
                Every Village holds at least one gathering a month, and members
                can visit the others.
              </p>
            </div>
            <Link className="btn btn-mint" href="/apply">
              Request your invitation
            </Link>
          </div>
        </section>
      )}
    </DualPage>
  );
}