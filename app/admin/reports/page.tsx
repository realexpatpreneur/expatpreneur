import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ReportDecision } from "./forms";

export const metadata = { title: "Reports, the Local Admin workspace" };

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, kind, subject_id, reporter_id, body, status, action_note, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const ids = [
    ...new Set(
      [
        ...(reports ?? []).map((r) => r.subject_id),
        ...(reports ?? []).map((r) => r.reporter_id),
      ].filter(Boolean) as string[]
    ),
  ];

  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name").in("id", ids)
    : { data: [] };

  const nameOf = (id: string | null) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";

  const open = (reports ?? []).filter(
    (r) => !["closed", "escalated"].includes(r.status)
  );
  const settled = (reports ?? []).filter((r) =>
    ["closed", "escalated"].includes(r.status)
  );

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin">Overview</Link>
          </p>
          <h1>Reports</h1>
          <p className="lead">
            Private. Never discuss these in Village channels.
          </p>
        </section>

        <section className="band">
          {open.length === 0 ? (
            <p className="muted">Nothing open.</p>
          ) : (
            <div className="stack">
              {open.map((report) => (
                <div className="panel" key={report.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h3>{report.kind}</h3>
                    <span className="chip sun">{report.status}</span>
                  </div>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    About {nameOf(report.subject_id)}. Reported by{" "}
                    {nameOf(report.reporter_id)}, {timeAgo(report.created_at)}.
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                    {report.body}
                  </p>
                  <ReportDecision id={report.id} />
                </div>
              ))}
            </div>
          )}

          {settled.length ? (
            <div className="panel" style={{ marginTop: 20 }}>
              <h3>Settled</h3>
              <div className="rows" style={{ marginTop: 12 }}>
                {settled.map((report) => (
                  <div className="rowlink" key={report.id}>
                    <div>
                      <b>{report.kind}</b>
                      <div className="muted small">
                        About {nameOf(report.subject_id)}.{" "}
                        {report.action_note ?? "No note."}
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">
                        {report.status === "escalated"
                          ? "With Global"
                          : "Closed here"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel wash" style={{ marginTop: 20 }}>
            <h3>When to send one up</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Anything involving safety, money, or a member you would have to
              remove. A Village should not be deciding those on its own, and
              the Global team has the record and the authority.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}