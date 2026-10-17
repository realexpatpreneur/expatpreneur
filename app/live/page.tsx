import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { sessionWhen, joinBlock, type LiveSession } from "@/lib/live";

export const metadata = { title: "Live rooms, ExpatPreneurs Global" };

export default async function LivePage() {
  const member = await requireMember("/live");
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("live_sessions")
    .select("*")
    .in("status", ["scheduled", "live"])
    .order("scheduled_start")
    .limit(40);

  const { data: villages } = await supabase.from("villages").select("id, name");
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Every Village";

  const rows = (sessions ?? []) as LiveSession[];

  // A room is only happening now if it is also still within its own
  // hours. Without this, a session left at "live" by mistake sits on
  // the page as live for ever, which is what it was doing.
  const stillOn = (s: LiveSession) => {
    const ends = s.scheduled_end
      ? new Date(s.scheduled_end).getTime()
      : new Date(s.scheduled_start).getTime() + 3 * 60 * 60 * 1000;
    return Date.now() < ends + 30 * 60 * 1000;
  };

  const live = rows.filter((s) => s.status === "live" && stillOn(s));
  const upcoming = rows.filter(
    (s) => s.status === "scheduled" || (s.status === "live" && !stillOn(s))
  );

  const card = (session: LiveSession) => {
    const blocked = joinBlock(session, member, false);
    return (
      <Link className="li linkrow" key={session.id} href={`/live/${session.slug}`}>
        <div>
          <b>{session.title}</b>
          <div className="muted small">
            {sessionWhen(session)}. {villageName(session.village_id)}.
          </div>
        </div>
        <div className="rowmeta">
          {session.status === "live" && stillOn(session) ? (
            <span className="chip chip-mint">Happening now</span>
          ) : null}
          {blocked ? <span className="chip chip-sun">{blocked}</span> : null}
          {session.recording !== "off" ? (
            <span className="chip">Recorded</span>
          ) : null}
        </div>
      </Link>
    );
  };

  return (
    <WorkspaceShell kind="member" nav="/live">
        <section className="sec">
          <h1>Live rooms</h1>
          <p className="lead">
            Roundtables, clinics and Circle calls. The same rules as
            everywhere else: your Village is open to you, the rest comes with
            the paid plan.
          </p>
        </section>

        {live.length ? (
          <section className="sec">
            <h2>Happening now</h2>
            <div className="divide">{live.map(card)}</div>
          </section>
        ) : null}

        <section className="sec">
          <h2>Coming up</h2>
          {upcoming.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing scheduled. Your Local Admin opens these.
              </p>
            </div>
          ) : (
            <div className="divide">{upcoming.map(card)}</div>
          )}
        </section>
      </WorkspaceShell>
  );
}