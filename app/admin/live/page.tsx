import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { sessionWhen, roleLabel, type LiveSession } from "@/lib/live";
import { AddHostForm } from "./forms";

export const metadata = { title: "Live rooms, Admin" };

export default async function AdminLivePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: sessions }, { data: hosts }, { data: people }, { data: attendance }] =
    await Promise.all([
      supabase
        .from("live_sessions")
        .select("*")
        .order("scheduled_start", { ascending: false })
        .limit(40),
      supabase.from("session_hosts").select("session_id, profile_id, role"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name")
        .limit(300),
      supabase.from("session_attendance").select("session_id, attended, waiting"),
    ]);

  const rows = ((sessions ?? []) as LiveSession[]).filter(
    (s) => admin.isGlobal || !s.village_id || admin.villageIds.includes(s.village_id)
  );

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Live rooms</h1>
        <p className="lead">
          Roundtables, clinics and Circle calls. Who runs them, who can come
          in, and who turned up.
        </p>
        {done ? <div className="flag ok">Saved.</div> : null}
        <p>
          <Link className="btn btn-primary" href="/admin/live/new">
            Schedule a session
          </Link>
        </p>
      </section>

      <section className="sec">
        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing scheduled yet.
            </p>
          </div>
        ) : (
          <div className="stack">
            {rows.map((session) => {
              const sessionHosts = (hosts ?? []).filter(
                (h) => h.session_id === session.id
              );
              const counts = attendance?.find((a) => a.session_id === session.id);
              return (
                <div className="panel" key={session.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h3>{session.title}</h3>
                    <span
                      className={`chip ${session.status === "live" ? "chip-mint" : ""}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {sessionWhen(session)}.{" "}
                    {session.visibility === "public" ? "Public" : "Members"}
                    {session.tier === "paid" ? ", paid only" : ""}.{" "}
                    {counts
                      ? `${counts.attended} attended, ${counts.waiting} waiting.`
                      : ""}
                  </p>
                  {sessionHosts.length ? (
                    <p className="muted small">
                      Running it:{" "}
                      {sessionHosts
                        .map(
                          (h) =>
                            `${nameOf(h.profile_id)} (${roleLabel[h.role] ?? h.role})`
                        )
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="muted small">
                      Nobody added yet. Whoever holds the Village or Circle role
                      still runs it.
                    </p>
                  )}
                  <AddHostForm sessionId={session.id} people={people ?? []} />
                  <p style={{ marginTop: 12 }}>
                    <Link className="btn btn-ghost" href={`/live/${session.slug}`}>
                      Open the room
                    </Link>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}