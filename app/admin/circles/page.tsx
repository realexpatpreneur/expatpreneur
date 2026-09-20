import { PageHead } from "@/components/workspace-shell";
import { Cap, Flag } from "@/components/admin-bits";
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

  const TONES = ["blue", "mint", "navy", "sun"];

  return (
    <>
      <PageHead
        title="Circles"
        sub="Fifty members each. When one fills, the next one opens."
      />
      {done ? <Flag ok>Saved.</Flag> : null}

      <div className="gside" style={{ marginTop: 16 }}>
        <div className="stack">
          {mine.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                No Circles yet. Create the first one.
              </p>
            </div>
          ) : (
            mine.map((circle, i) => {
              const counts = countFor(circle.id);
              const full = counts.places_left <= 5;
              return (
                <div
                  className={`circlecard has-cover ${full ? "full" : ""}`}
                  key={circle.id}
                >
                  <span className={`ctile ct-${TONES[i % TONES.length]}`}>
                    <b>{circle.name}</b>
                    <span>{counts.members} members</span>
                  </span>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className={`chip ${full ? "chip-sun" : "chip-mint"}`}>
                      {circle.status}
                    </span>
                    <span className="chip">
                      {counts.places_left} places left
                    </span>
                  </div>
                  <Cap
                    name="Members"
                    value={counts.members ?? 0}
                    max={(counts.members ?? 0) + (counts.places_left ?? 0)}
                  />
                  <div className="ready">
                    <span className={`chip ${circle.whatsapp_url ? "chip-mint" : ""}`}>
                      {circle.whatsapp_url
                        ? "WhatsApp group linked"
                        : "WhatsApp group not linked"}
                    </span>
                  </div>
                  <CircleForm villages={myVillages} circle={circle} />
                </div>
              );
            })
          )}
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Open a new Circle</h3>
            <CircleForm villages={myVillages} />
          </div>
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>Why fifty</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Past fifty people stop knowing each other. A full Circle is a good
              sign, not a problem: open the next one and keep the first intact.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}