import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";
import { CityForm } from "../forms";

export default async function GlobalCitiesPage() {
  const supabase = await createClient();

  const { data: cities } = await supabase
    .from("city_suggestions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const counts = new Map<string, number>();
  for (const city of cities ?? []) {
    const key = `${city.city}, ${city.country}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Cities people are asking for</h1>
        <p className="lead">
          Where the next Villages are, if enough people keep asking.
        </p>
      </section>

      <section className="sec">
        {(cities ?? []).length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nobody has suggested a city yet.
            </p>
          </div>
        ) : (
          <div className="stack">
            {[...counts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([place, count]) => (
                <div className="panel" key={place}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h3>{place}</h3>
                    <span className="chip chip-blue">{count} asking</span>
                  </div>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(cities ?? [])
                      .filter((c) => `${c.city}, ${c.country}` === place)
                      .map((city) => (
                        <div className="li linkrow" key={city.id}>
                          <div style={{ width: "100%" }}>
                            <b>{city.name || city.email || "Someone"}</b>
                            <div className="muted small">
                              {city.offers_admin
                                ? "Offered to run it. "
                                : ""}
                              {timeAgo(city.created_at)}.
                            </div>
                            <CityForm
                              cityId={city.id}
                              status={city.status}
                              note={city.note}
                            />
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