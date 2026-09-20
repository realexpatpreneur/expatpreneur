import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { EventForm } from "../forms";

export const metadata = { title: "Create an event, Admin" };

export default async function NewEventPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: villages }, { data: circles }] = await Promise.all([
    supabase.from("villages").select("id, name").order("name"),
    supabase.from("circles").select("id, name, village_id").order("name"),
  ]);

  const mine = (villages ?? []).filter(
    (v) => admin.isGlobal || admin.villageIds.includes(v.id)
  );

  const audiences = [
    { value: "global", label: "Every Village" },
    ...mine.map((v) => ({ value: `village:${v.id}`, label: `${v.name} Village` })),
    ...(circles ?? [])
      .filter((c) => admin.isGlobal || admin.villageIds.includes(c.village_id))
      .map((c) => ({ value: `circle:${c.id}`, label: c.name })),
  ];

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/events">Events</Link>
        </p>
        <h1>Create an event</h1>
        <p className="lead">
          Public events can be found and booked by anyone. Private ones are for
          the members you choose.
        </p>
      </section>
      <section className="band">
        <EventForm audiences={audiences} />
      </section>
    </main>
  );
}