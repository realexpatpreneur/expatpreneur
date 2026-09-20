import { createClient } from "@/lib/supabase/server";
import { NATIONALITY_LIMIT } from "@/lib/access";

// Internal only. This number never appears on a public page, in the member
// space, or in anything written to an applicant.
export default async function GlobalMixPage() {
  const supabase = await createClient();

  const { data: mix } = await supabase
    .from("village_nationality_mix")
    .select("village, nationality, members, percent")
    .order("village");

  const byVillage = new Map<string, typeof mix>();
  for (const row of mix ?? []) {
    const list = byVillage.get(row.village) ?? [];
    list.push(row);
    byVillage.set(row.village, list as typeof mix);
  }

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Village balance</h1>
        <p className="lead">
          No Village above {Math.round(NATIONALITY_LIMIT * 100)} percent of one
          nationality. Internal only, and never mentioned to members.
        </p>
      </section>

      <section className="sec">
        {byVillage.size === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Not enough members yet to say anything useful.
            </p>
          </div>
        ) : (
          <div className="stack">
            {[...byVillage.entries()].map(([village, rows]) => (
              <div className="panel" key={village}>
                <h3>{village}</h3>
                <div className="divide" style={{ marginTop: 12 }}>
                  {(rows ?? [])
                    .slice()
                    .sort((a, b) => Number(b.percent) - Number(a.percent))
                    .map((row) => (
                      <div className="li linkrow" key={`${village}-${row.nationality}`}>
                        <div>
                          <b>{row.nationality}</b>
                          <div className="muted small">
                            {row.members} members, {row.percent} percent
                          </div>
                        </div>
                        <div className="rowmeta">
                          {Number(row.percent) > NATIONALITY_LIMIT * 100 ? (
                            <span className="chip chip-sun">Over the limit</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}