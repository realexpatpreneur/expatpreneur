import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: villages }, { data: circles }] = await Promise.all([
    supabase.from("villages").select("id, name").order("name"),
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
      <section className="band">
        <p className="muted small">
          <Link href={`/admin/events/${id}`}>{event.title}</Link>
        </p>
        <h1>Edit event</h1>
      </section>
      <section className="band">
        <EventForm audiences={audiences} event={event} />
      </section>
    </main>
  );
}