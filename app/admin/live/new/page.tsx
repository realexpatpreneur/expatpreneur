import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { SessionForm } from "../forms";

export const metadata = { title: "Schedule a session, Admin" };

export default async function NewSessionPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: villages }, { data: circles }, { data: groups }, { data: pods }, { data: events }] =
    await Promise.all([
      supabase.from("villages").select("id, name").order("name"),
      supabase.from("circles").select("id, name, village_id").order("name"),
      supabase.from("industry_groups").select("id, name").order("name"),
      supabase.from("pods").select("id, name, village_id").order("name"),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(20),
    ]);

  const mine = (villages ?? []).filter(
    (v) => admin.isGlobal || admin.villageIds.includes(v.id)
  );

  // Their own Village first, because that is what a Local Admin usually
  // means. Every Village has to be chosen on purpose.
  const home = mine.find((v) => v.id === admin.homeVillageId) ?? mine[0];

  const audiences = [
    ...(home
      ? [{ value: `village:${home.id}`, label: `${home.name} Village` }]
      : []),
    { value: "global", label: "Every Village" },
    ...mine
      .filter((v) => v.id !== home?.id)
      .map((v) => ({ value: `village:${v.id}`, label: `${v.name} Village` })),
    ...(circles ?? [])
      .filter((c) => admin.isGlobal || admin.villageIds.includes(c.village_id))
      .map((c) => ({ value: `circle:${c.id}`, label: c.name })),
    ...(groups ?? []).map((g) => ({ value: `group:${g.id}`, label: g.name })),
    ...(pods ?? [])
      .filter((p) => admin.isGlobal || !p.village_id || admin.villageIds.includes(p.village_id))
      .map((p) => ({ value: `pod:${p.id}`, label: p.name })),
  ];

  return (
    <main className="wrap">
      <section className="sec">
        <p className="muted small">
          <Link href="/admin/live">Live rooms</Link>
        </p>
        <h1>Schedule a session</h1>
        <p className="lead">
          A room can belong to a Village, a Circle, an Industry Group, a Pod or
          the whole network, and it follows the same rules as everything else.
        </p>
      </section>
      <section className="sec">
        <SessionForm
          audiences={audiences}
          events={(events ?? []).map((e) => ({ value: e.id, label: e.title }))}
        />
      </section>
    </main>
  );
}