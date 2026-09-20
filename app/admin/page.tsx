import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Stat, Task, Cap, Flag, SecHead } from "@/components/admin-bits";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
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
    <>
      <PageHead
        title={`${village?.name ?? "Your"} Village`}
        sub="How the Village is doing this month"
        actions={
          <Link className="btn btn-primary" href="/admin/announcements">
            <Ic name="bell" />
            Post an announcement
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
          <SecHead title="To do" />
          <div className="divide">
            {(whatsapp ?? []).map((task) => (
              <Task
                key={task.id}
                href="/admin/whatsapp"
                tag="WhatsApp"
                title={
                  task.kind === "add"
                    ? "Add somebody to a WhatsApp group"
                    : task.kind === "remove"
                      ? "Take somebody out of a WhatsApp group"
                      : "Move somebody between groups"
                }
                sub={task.group_name}
              />
            ))}

            {(openRequests ?? 0) > 0 ? (
              <Task
                href="/admin/applications"
                tag="Curation"
                title={`Read ${openRequests} invitation ${
                  openRequests === 1 ? "request" : "requests"
                }`}
                sub="The balance panel shows what each would do to the mix."
              />
            ) : null}

            {quietCount > 0 ? (
              <Task
                href="/admin/care"
                tag="Member care"
                title={`Check in with ${quietCount} quiet members`}
                sub="A friendly message, not a warning."
              />
            ) : null}

            {(renewals ?? []).length > 0 ? (
              <Task
                href="/admin/care"
                tag="Re-enrolment"
                title="Follow up on re-enrolment"
                sub={`${answered} of ${(renewals ?? []).length} have answered.`}
              />
            ) : null}

            {(reports ?? []).map((report) => (
              <Task
                key={report.id}
                href="/admin/reports"
                tag="Reports"
                title={`Look at a report: ${report.kind}`}
                sub="Private."
              />
            ))}

            {(whatsapp ?? []).length === 0 &&
            (openRequests ?? 0) === 0 &&
            quietCount === 0 &&
            (reports ?? []).length === 0 ? (
              <Task
                title="Nothing waiting on you"
                sub="Which is worth something in itself."
              />
            ) : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <SecHead title="Circle capacity" href="/admin/circles" />
            {(circles ?? []).length === 0 ? (
              <p className="muted small">No Circles yet.</p>
            ) : (
              (circles ?? []).map((circle) => (
                <Cap
                  key={circle.circle_id}
                  name={circle.name}
                  value={circle.members ?? 0}
                  max={circle.capacity ?? 50}
                />
              ))
            )}
          </div>

          <div className="panel">
            <SecHead title="Village mix" href="/admin/mix" label="Details" />
            {largest ? (
              Number(largest.percent) >= limit - 3 ? (
                <Flag>
                  {largest.nationality} members are {largest.percent} percent of
                  this Village, close to the {limit} percent limit.
                </Flag>
              ) : (
                <Flag ok>
                  The largest group is {largest.nationality} at{" "}
                  {largest.percent} percent, under the {limit} percent limit.
                </Flag>
              )
            ) : (
              <p className="muted small">
                Not enough given yet to say anything.
              </p>
            )}
          </div>

          <div className="panel">
            <SecHead title="Next event" href="/admin/events" label="All events" />
            {(events ?? []).length === 0 ? (
              <p className="muted small">Nothing on the calendar.</p>
            ) : (
              <div className="divide">
                {(events ?? []).map((event) => {
                  const d = new Date(event.starts_at);
                  return (
                    <EventRow
                      key={event.id}
                      href={`/admin/events/${event.id}`}
                      day={String(d.getDate())}
                      month={d.toLocaleDateString("en-GB", { month: "short" })}
                      title={event.title}
                      line={whenText(event)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}