import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { whenText } from "@/lib/events";

export const metadata = { title: "Overview, the Local Admin workspace" };

// The Local Admin home, built around stewardship. Every figure opens the
// page where it is handled.
export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageIds = admin.villageIds.length
    ? admin.villageIds
    : ["00000000-0000-0000-0000-000000000000"];

  const [
    { data: village },
    { count: activeMembers },
    { count: openRequests },
    { data: reports },
    { data: whatsapp },
    { data: events },
    { data: circles },
    { data: mix },
    { data: settings },
    { data: renewals },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, name, city")
      .eq("id", villageIds[0])
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "active"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("status", ["new", "with_local"]),
    supabase
      .from("reports")
      .select("id, kind, created_at, status")
      .not("status", "in", "(closed,escalated)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("whatsapp_tasks")
      .select("id, kind, group_name, profile_id")
      .in("village_id", villageIds)
      .is("done_at", null)
      .limit(10),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online")
      .in("village_id", villageIds)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
    supabase
      .from("circle_capacity")
      .select("circle_id, name, members, capacity, places_left")
      .in("village_id", villageIds)
      .order("name"),
    supabase
      .from("village_nationality_mix")
      .select("nationality, percent, village_id")
      .in("village_id", villageIds)
      .order("percent", { ascending: false })
      .limit(1),
    supabase.from("settings").select("key, value"),
    supabase
      .from("re_enrolments")
      .select("id, status")
      .in("village_id", villageIds),
  ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const limit = Number(values.nationality_limit ?? 30);

  const quietDays = Number(values.quiet_days ?? 45);
  const { data: quiet } = await supabase
    .from("member_activity")
    .select("profile_id, posts, replies, attended")
    .in("village_id", villageIds);

  const quietCount = (quiet ?? []).filter(
    (m) => (m.posts ?? 0) + (m.replies ?? 0) + (m.attended ?? 0) === 0
  ).length;

  const answered = (renewals ?? []).filter((r) => r.status !== "pending").length;
  const largest = (mix ?? [])[0];

  const stats: [string, number | string, string, string][] = [
    ["Active members", activeMembers ?? 0, "In this Village", "/admin/members"],
    ["Invitation requests", openRequests ?? 0, "Waiting on you", "/admin/applications"],
    ["Open reports", (reports ?? []).length, "Handled privately", "/admin/reports"],
    ["Quiet members", quietCount, `No activity in ${quietDays} days`, "/admin/care"],
  ];

  return (
    <main className="wrap">
        <section className="band">
          <h1>{village?.name ?? "Your"} Village</h1>
          <p className="lead">How the Village is doing this month.</p>
          <p>
            <Link className="btn primary" href="/admin/announcements">
              Post an announcement
            </Link>
          </p>
        </section>

        <section className="band">
          <div className="grid">
            {stats.map(([label, value, note, href]) => (
              <Link className="card" href={href} key={label}>
                <div className="kind">{label}</div>
                <p>
                  <b style={{ fontSize: 24 }}>{value}</b>
                </p>
                <div className="meta">
                  <span className="chip">{note}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>To do</h3>
              <div className="rows" style={{ marginTop: 12 }}>
                {(whatsapp ?? []).map((task) => (
                  <Link className="rowlink" href="/admin/whatsapp" key={task.id}>
                    <div>
                      <b>
                        {task.kind === "add"
                          ? "Add somebody to a WhatsApp group"
                          : task.kind === "remove"
                            ? "Take somebody out of a WhatsApp group"
                            : "Move somebody between groups"}
                      </b>
                      <div className="muted small">{task.group_name}</div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">WhatsApp</span>
                    </div>
                  </Link>
                ))}

                {(openRequests ?? 0) > 0 ? (
                  <Link className="rowlink" href="/admin/applications">
                    <div>
                      <b>
                        Read {openRequests} invitation{" "}
                        {openRequests === 1 ? "request" : "requests"}
                      </b>
                      <div className="muted small">
                        The balance panel shows what each would do to the mix.
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">Curation</span>
                    </div>
                  </Link>
                ) : null}

                {quietCount > 0 ? (
                  <Link className="rowlink" href="/admin/care">
                    <div>
                      <b>Check in with {quietCount} quiet members</b>
                      <div className="muted small">
                        A friendly message, not a warning.
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">Member care</span>
                    </div>
                  </Link>
                ) : null}

                {(renewals ?? []).length > 0 ? (
                  <Link className="rowlink" href="/admin/care">
                    <div>
                      <b>Follow up on re-enrolment</b>
                      <div className="muted small">
                        {answered} of {(renewals ?? []).length} have answered.
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">Re-enrolment</span>
                    </div>
                  </Link>
                ) : null}

                {(reports ?? []).map((report) => (
                  <Link className="rowlink" href="/admin/reports" key={report.id}>
                    <div>
                      <b>Look at a report: {report.kind}</b>
                      <div className="muted small">Private.</div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip sun">Reports</span>
                    </div>
                  </Link>
                ))}

                {(whatsapp ?? []).length === 0 &&
                (openRequests ?? 0) === 0 &&
                quietCount === 0 &&
                (reports ?? []).length === 0 ? (
                  <div className="rowlink">
                    <div>
                      <b>Nothing waiting on you</b>
                      <div className="muted small">
                        Which is worth something in itself.
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3>Circle capacity</h3>
                  <Link className="muted small" href="/admin/circles">
                    Manage
                  </Link>
                </div>
                {(circles ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    No Circles yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(circles ?? []).map((circle) => (
                      <div className="rowlink" key={circle.circle_id}>
                        <div>
                          <b>{circle.name}</b>
                          <div className="muted small">
                            {circle.members} of {circle.capacity}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${circle.places_left <= 5 ? "sun" : ""}`}
                          >
                            {circle.places_left} places
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3>Village mix</h3>
                  <Link className="muted small" href="/admin/mix">
                    Details
                  </Link>
                </div>
                {largest ? (
                  <p
                    className={`muted small ${
                      Number(largest.percent) >= limit - 3 ? "" : ""
                    }`}
                    style={{ marginTop: 6 }}
                  >
                    {largest.nationality} members are {largest.percent} percent
                    of this Village
                    {Number(largest.percent) >= limit - 3
                      ? `, close to the ${limit} percent limit.`
                      : "."}
                  </p>
                ) : (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Not enough given yet to say anything.
                  </p>
                )}
              </div>

              <div className="panel">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3>Next event</h3>
                  <Link className="muted small" href="/admin/events">
                    All events
                  </Link>
                </div>
                {(events ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing on the calendar.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(events ?? []).map((event) => (
                      <Link
                        className="rowlink"
                        href={`/admin/events/${event.id}`}
                        key={event.id}
                      >
                        <div>
                          <b>{event.title}</b>
                          <div className="muted small">{whenText(event)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}