import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVENT_COLUMNS } from "@/lib/events";
import { requireAdmin } from "@/lib/access";
import { EventForm } from "../../forms";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const supabase = await createClient();

  // The Zoom link and the full address no longer live on the table for a
  // reader; event_details serves them, and an admin of this Village is one
  // of the two people it serves them to.
  const [{ data: base }, { data: details }] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("event_details").select("address, online_url").eq("id", id).maybeSingle(),
  ]);

  if (!base) notFound();

  const event = {
    ...base,
    address: details?.address ?? null,
    online_url: details?.online_url ?? null,
  };

  const [{ data: villages }, { data: circles }] = await Promise.all([
    supabase.from("villages").select("id, name").neq("status", "archived").order("name"),
    supabase.from("circles").select("id, name, village_id").order("name"),
  ]);

  const audiences = [
    { value: "global", label: "Every Village" },
    ...(villages ?? [])
      .filter((v) => admin.isGlobal || admin.villageIds.includes(v.id))
      .map((v) => ({ value: `village:${v.id}`, label: `${v.name} Village` })),
    ...(circles ?? [])
      .filter((c) => admin.isGlobal || admin.villageIds.includes(c.village_id))
      .map((c) => ({ value: `circle:${c.id}`, label: c.name })),
  ];

  return (
    <main className="wrap">
      <section className="sec">
        <p className="muted small">
          <Link href={`/admin/events/${id}`}>{event.title}</Link>
        </p>
        <h1>Edit event</h1>
      </section>
      <section className="sec">
        <EventForm audiences={audiences} event={event} />
      </section>
    </main>
  );
}