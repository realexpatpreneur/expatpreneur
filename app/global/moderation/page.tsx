import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";
import { ReportForm } from "../forms";

export default async function GlobalModerationPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = [
    ...new Set(
      (reports ?? []).flatMap((r) => [r.reporter_id, r.subject_id]).filter(Boolean)
    ),
  ] as string[];

  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const nameOf = (id: string | null) =>
    id ? people?.find((p) => p.id === id)?.full_name ?? "A member" : "Not named";

  const open = (reports ?? []).filter((r) => r.status !== "closed");
  const closed = (reports ?? []).filter((r) => r.status === "closed");

  return (
    <main className="wrap">
      <section className="band">
        <h1>Moderation</h1>
        <p className="lead">
          What members reported, what was done, and by whom. Handled quietly,
          and recorded properly.
        </p>
      </section>

      <section className="band">
        <h2>Open</h2>
        {open.length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing open.
            </p>
          </div>
        ) : (
          <div className="stack">
            {open.map((report) => (
              <div className="panel" key={report.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3>About {nameOf(report.subject_id)}</h3>
                  <span className="chip sun">{report.status}</span>
                </div>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Reported by {nameOf(report.reporter_id)}.{" "}
                  {timeAgo(report.created_at)}.
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{report.body}</p>
                <ReportForm
                  reportId={report.id}
                  status={report.status}
                  note={report.action_note}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {closed.length ? (
        <section className="band">
          <h2>Closed</h2>
          <div className="rows">
            {closed.map((report) => (
              <div className="rowlink" key={report.id}>
                <div>
                  <b>About {nameOf(report.subject_id)}</b>
                  <div className="muted small">
                    {report.action_note ?? "No note"}. {timeAgo(report.created_at)}.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}