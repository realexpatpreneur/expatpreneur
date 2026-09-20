import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function GlobalOverviewPage() {
  const supabase = await createClient();

  const [
    { data: villages },
    { count: members },
    { count: paid },
    { count: waitingApplications },
    { count: openReports },
    { count: newSuggestions },
  ] = await Promise.all([
    supabase.from("villages").select("id, name, status, city, country").order("name"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan", "paid"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "with_local", "recommended"]),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .neq("status", "closed"),
    supabase
      .from("suggestions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const { data: perVillage } = await supabase
    .from("profiles")
    .select("village_id, status");

  const countIn = (id: string) =>
    (perVillage ?? []).filter(
      (p) => p.village_id === id && p.status === "active"
    ).length;

  return (
    <main className="wrap">
      <section className="band">
        <h1>The network</h1>
        <p className="lead">
          Where the Villages are, how they are doing, and what is waiting on
          you.
        </p>
      </section>

      <section className="band">
        <div className="grid three">
          <div className="panel">
            <h3>Active members</h3>
            <p className="lead" style={{ margin: 0 }}>{members ?? 0}</p>
          </div>
          <div className="panel">
            <h3>On the paid plan</h3>
            <p className="lead" style={{ margin: 0 }}>{paid ?? 0}</p>
          </div>
          <div className="panel">
            <h3>Requests waiting</h3>
            <p className="lead" style={{ margin: 0 }}>{waitingApplications ?? 0}</p>
          </div>
          <div className="panel">
            <h3>Open reports</h3>
            <p className="lead" style={{ margin: 0 }}>{openReports ?? 0}</p>
          </div>
          <div className="panel">
            <h3>New suggestions</h3>
            <p className="lead" style={{ margin: 0 }}>{newSuggestions ?? 0}</p>
          </div>
          <div className="panel">
            <h3>Villages</h3>
            <p className="lead" style={{ margin: 0 }}>{(villages ?? []).length}</p>
          </div>
        </div>
      </section>

      <section className="band">
        <h2>Villages</h2>
        <div className="rows">
          {(villages ?? []).map((village) => (
            <Link className="rowlink" key={village.id} href="/global/villages">
              <div>
                <b>{village.name}</b>
                <div className="muted small">
                  {village.city}, {village.country}. {countIn(village.id)} active
                  members.
                </div>
              </div>
              <div className="rowmeta">
                <span className={`chip ${village.status === "open" ? "mint" : ""}`}>
                  {village.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}