import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Stat, Task, SecHead } from "@/components/admin-bits";
import { Ic } from "@/components/icon";
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

  const stats: [string, number | string, string, string][] = [
    ["Members", members ?? 0, "Active across the network", "/admin/members"],
    ["Villages", (villages ?? []).length, "Open, launching and explored", "/global/villages"],
    ["Invitation requests", waitingApplications ?? 0, "You decide for now", "/admin/applications"],
    ["Escalations", openReports ?? 0, "From Local Admins", "/global/moderation"],
  ];

  return (
    <>
      <PageHead
        title="ExpatPreneurs Global"
        sub="The whole network this month"
        actions={
          <Link className="btn btn-primary" href="/global/villages">
            <Ic name="plus" />
            New Village
          </Link>
        }
      />

      <div className="g3 g4">
        {stats.map(([label, value, note, href]) => (
          <Stat key={label} label={label} value={value} note={note} href={href} />
        ))}
      </div>

      <div className="gside" style={{ marginTop: 22 }}>
        <div className="panel">
          <SecHead title="Needs Global" />
          <div className="divide">
            {(waitingApplications ?? 0) > 0 ? (
              <Task
                href="/admin/applications"
                tag="Curation"
                title={`Decide on ${waitingApplications} invitation ${
                  waitingApplications === 1 ? "request" : "requests"
                }`}
                sub="Each one carries the Local Admin's note and the balance check."
              />
            ) : null}
            {(openReports ?? 0) > 0 ? (
              <Task
                href="/global/moderation"
                tag="Reports"
                title={`Look at ${openReports} escalated ${
                  openReports === 1 ? "report" : "reports"
                }`}
                sub="Raised by a Village that could not settle it locally."
              />
            ) : null}
            {(newSuggestions ?? 0) > 0 ? (
              <Task
                href="/global/suggestions"
                tag="Curation"
                title={`Read ${newSuggestions} new ${
                  newSuggestions === 1 ? "suggestion" : "suggestions"
                }`}
                sub="What members think could be better."
              />
            ) : null}
            {(villages ?? []).some((v) => v.status !== "open") ? (
              <Task
                href="/global/villages"
                tag="Villages"
                title="Prepare the Villages that are not open yet"
                sub="Local Admins, the first Circle Host, and the Village page."
              />
            ) : null}
            {(waitingApplications ?? 0) === 0 &&
            (openReports ?? 0) === 0 &&
            (newSuggestions ?? 0) === 0 ? (
              <Task
                title="Nothing waiting on you"
                sub="Which is worth something in itself."
              />
            ) : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <SecHead title="Villages" href="/global/villages" />
            <div className="divide">
              {(villages ?? []).map((village) => (
                <Link className="li linkrow" key={village.id} href="/global/villages">
                  <div>
                    <b>{village.name}</b>
                    <div className="muted small">
                      {village.city}, {village.country}. {countIn(village.id)}{" "}
                      active members.
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span
                      className={`chip ${
                        village.status === "open" ? "chip-mint" : "chip-sun"
                      }`}
                    >
                      {village.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel">
            <SecHead title="Membership" href="/global/plans" label="Plans" />
            <dl className="kv" style={{ gridTemplateColumns: "1fr auto", marginTop: 8 }}>
              <dt>On the paid plan</dt>
              <dd>{paid ?? 0}</dd>
              <dt>Everyone else</dt>
              <dd>{Math.max(0, (members ?? 0) - (paid ?? 0))}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}