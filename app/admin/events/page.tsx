import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { whenText, priceText, audienceText, type EventRow } from "@/lib/events";

export const metadata = { title: "Events, Admin" };

export default async function AdminEventsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(50);

  const { data: villages } = await supabase.from("villages").select("id, name");

  const rows = ((events ?? []) as EventRow[]).filter(
    (event) =>
      admin.isGlobal ||
      !event.village_id ||
      admin.villageIds.includes(event.village_id)
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? null;

  return (
    <main className="wrap">
      <section className="band">
        <h1>Events</h1>
        <p className="lead">
          What is on, who can register, and how full it is.
        </p>
        <p>
          <Link className="btn primary" href="/admin/events/new">
            Create an event
          </Link>
        </p>
      </section>

      <section className="band">
        {rows.length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet. Create the first one.
            </p>
          </div>
        ) : (
          <div className="rows">
            {rows.map((event) => (
              <Link className="rowlink" key={event.id} href={`/admin/events/${event.id}`}>
                <div>
                  <b>{event.title}</b>
                  <div className="muted small">
                    {whenText(event)}. {event.venue ?? "Online"}. {priceText(event)}.
                  </div>
                </div>
                <div className="rowmeta">
                  <span className="chip">
                    {audienceText(event, villageName(event.audience_id ?? event.village_id))}
                  </span>
                  <span className={`chip ${event.status === "published" ? "mint" : ""}`}>
                    {event.status}
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