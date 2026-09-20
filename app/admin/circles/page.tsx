import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { CircleForm } from "../members/forms";

export const metadata = { title: "Circles, Admin" };

export default async function AdminCirclesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: circles }, { data: capacity }, { data: villages }] =
    await Promise.all([
      supabase.from("circles").select("*").order("name"),
      supabase.from("circle_capacity").select("circle_id, members, places_left"),
      supabase.from("villages").select("id, name").order("name"),
    ]);

  const mine = (circles ?? []).filter(
    (c) => admin.isGlobal || admin.villageIds.includes(c.village_id)
  );
  const myVillages = (villages ?? []).filter(
    (v) => admin.isGlobal || admin.villageIds.includes(v.id)
  );
  const countFor = (id: string) =>
    capacity?.find((c) => c.circle_id === id) ?? { members: 0, places_left: 50 };

  return (
    <main className="wrap">
      <section className="band">
        <h1>Circles</h1>
        <p className="lead">
          Fifty members each. When one fills, the next one opens.
        </p>
        {done ? <div className="notice good">Saved.</div> : null}
      </section>

      <section className="band">
        <div className="cols">
          <div className="stack">
            {mine.length === 0 ? (
              <div className="panel wash">
                <p className="muted" style={{ margin: 0 }}>
                  No Circles yet. Create the first one.
                </p>
              </div>
            ) : (
              mine.map((circle) => {
                const counts = countFor(circle.id);
                return (
                  <div className="panel" key={circle.id}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <h3>{circle.name}</h3>
                      <span className="chip">{circle.status}</span>
                    </div>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {counts.members} members, {counts.places_left} places left.{" "}
                      {circle.whatsapp_url
                        ? "WhatsApp group linked."
                        : "No WhatsApp link yet."}
                    </p>
                    <CircleForm villages={myVillages} circle={circle} />
                  </div>
                );
              })
            )}
          </div>

          <div className="stack">
            <CircleForm villages={myVillages} />
            <div className="panel wash">
              <h3>Why fifty</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Past fifty people stop knowing each other. A full Circle is a
                good sign, not a problem: open the next one and keep the first
                intact.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}