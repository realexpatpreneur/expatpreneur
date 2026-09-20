import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

export const metadata = { title: "How the Village is doing, Admin" };

const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export default async function VillageInsightPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const villageId = admin.homeVillageId ?? admin.villageIds[0] ?? null;

  if (!villageId) {
    return (
      <main className="wrap">
        <section className="sec">
          <h1>No Village</h1>
          <p className="lead">This page is for a Local Admin of one Village.</p>
        </section>
      </main>
    );
  }

  const [
    { data: summary },
    { data: growth },
    { data: asks },
    { data: turnout },
    { data: rooms },
    { data: renewals },
  ] = await Promise.all([
    supabase
      .from("village_summary")
      .select("*")
      .eq("village_id", villageId)
      .maybeSingle(),
    supabase
      .from("village_growth")
      .select("month, joined")
      .eq("village_id", villageId)
      .order("month", { ascending: false })
      .limit(6),
    supabase
      .from("village_asks")
      .select("posts, answered, resolved, recent")
      .eq("village_id", villageId)
      .maybeSingle(),
    supabase
      .from("village_turnout")
      .select("events, registered, attended")
      .eq("village_id", villageId)
      .maybeSingle(),
    supabase
      .from("village_rooms")
      .select("sessions, came, average_minutes")
      .eq("village_id", villageId)
      .maybeSingle(),
    supabase
      .from("renewal_summary")
      .select("cycle, asked, staying, leaving, waiting")
      .eq("village_id", villageId)
      .order("cycle", { ascending: false })
      .limit(2),
  ]);

  const answeredShare =
    asks?.posts && asks.posts > 0
      ? Math.round((asks.answered / asks.posts) * 100)
      : null;
  const turnoutShare =
    turnout?.registered && turnout.registered > 0
      ? Math.round((turnout.attended / turnout.registered) * 100)
      : null;

  return (
    <main className="wrap">
      <section className="sec">
        <h1>How the Village is doing</h1>
        <p className="lead">
          {summary?.name}. Counts only. Nothing here reads anybody&apos;s
          messages.
        </p>
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>Active members</h3>
            <p className="lead" style={{ margin: 0 }}>{summary?.members ?? 0}</p>
            <p className="muted small">
              {summary?.quiet ?? 0} marked quiet
            </p>
          </div>
          <div className="panel">
            <h3>On the paid plan</h3>
            <p className="lead" style={{ margin: 0 }}>{summary?.paid ?? 0}</p>
            <p className="muted small">
              {summary?.members
                ? `${Math.round(((summary.paid ?? 0) / summary.members) * 100)} percent`
                : ""}
            </p>
          </div>
          <div className="panel">
            <h3>Requests waiting</h3>
            <p className="lead" style={{ margin: 0 }}>{summary?.waiting ?? 0}</p>
            <p className="muted small">{summary?.circles ?? 0} Circles open</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="gside">
          <div className="stack">
            <div className="panel">
              <h3>Does asking here work?</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                The one number that says whether a Village is alive. A post
                that goes unanswered is what makes people stop posting.
              </p>
              <dl className="kv">
                <dt>Posts</dt>
                <dd>{asks?.posts ?? 0}</dd>
                <dt>Answered</dt>
                <dd>
                  {asks?.answered ?? 0}
                  {answeredShare !== null ? `, ${answeredShare} percent` : ""}
                </dd>
                <dt>Closed as sorted</dt>
                <dd>{asks?.resolved ?? 0}</dd>
                <dt>Posted in the last month</dt>
                <dd>{asks?.recent ?? 0}</dd>
              </dl>
              {answeredShare !== null && answeredShare < 70 ? (
                <div className="flag hold">
                  Under seven in ten getting an answer. Worth chasing the
                  unanswered ones yourself.
                </div>
              ) : null}
            </div>

            <div className="panel">
              <h3>Events</h3>
              <dl className="kv">
                <dt>Events held</dt>
                <dd>{turnout?.events ?? 0}</dd>
                <dt>Registered</dt>
                <dd>{turnout?.registered ?? 0}</dd>
                <dt>Checked in</dt>
                <dd>
                  {turnout?.attended ?? 0}
                  {turnoutShare !== null ? `, ${turnoutShare} percent` : ""}
                </dd>
              </dl>
              <p className="muted small">
                Registering is easy. Turning up is the test. If checking in is
                not being done at the door, this number will read low whatever
                the room looked like.
              </p>
            </div>

            <div className="panel">
              <h3>Live rooms</h3>
              <dl className="kv">
                <dt>Sessions finished</dt>
                <dd>{rooms?.sessions ?? 0}</dd>
                <dt>People who came</dt>
                <dd>{rooms?.came ?? 0}</dd>
                <dt>Average time in the room</dt>
                <dd>
                  {rooms?.average_minutes
                    ? `${rooms.average_minutes} minutes`
                    : "Not enough yet"}
                </dd>
              </dl>
            </div>
          </div>

          <div className="stack">
            <div className="panel">
              <h3>People arriving</h3>
              {(growth ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing yet.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(growth ?? []).map((row) => (
                    <div className="li linkrow" key={row.month}>
                      <div>
                        <b>{monthName(row.month)}</b>
                      </div>
                      <div className="rowmeta">
                        <span className="chip">{row.joined}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(renewals ?? []).length ? (
              <div className="panel">
                <h3>Re-enrolment</h3>
                {(renewals ?? []).map((row) => (
                  <div key={row.cycle} style={{ marginTop: 10 }}>
                    <b>{row.cycle}</b>
                    <p className="muted small" style={{ margin: "4px 0 0" }}>
                      {row.asked} asked, {row.staying} staying, {row.leaving}{" "}
                      leaving, {row.waiting} still to answer.
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="panel panel-wash">
              <h3>What these numbers cannot tell you</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Whether people like each other. Whether the last dinner was any
                good. Whether someone is about to leave. For that, look at
                Care and speak to people.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}