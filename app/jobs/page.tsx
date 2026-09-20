import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";

export const metadata = { title: "Jobs and freelance, ExpatPreneurs Global" };

const kindLabel: Record<string, string> = {
  job: "Hiring",
  freelance: "Freelance",
  partner: "Partner",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; done?: string }>;
}) {
  const { show = "all", done } = await searchParams;
  const member = await requireMember("/jobs");
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("id, title, kind, location, remote, compensation, status, created_at, poster_id, reach, village_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);

  if (show === "mine") query = query.eq("poster_id", member.id);
  if (show !== "all" && show !== "mine") query = query.eq("kind", show);

  const { data: jobs } = await query;

  const ids = [...new Set((jobs ?? []).map((j) => j.poster_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  return (
    <WorkspaceShell kind="member" nav="/jobs">
        <section className="sec">
          <h1>Jobs and freelance</h1>
          <p className="lead">
            Members hiring members, and the work that goes with it. Say what it
            pays.
          </p>
          {done ? <div className="flag ok">Posted.</div> : null}
          <p>
            <Link className="btn btn-primary" href="/jobs/new">
              Post something
            </Link>
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["job", "Hiring"],
              ["freelance", "Freelance"],
              ["partner", "Partners"],
              ["mine", "Mine"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/jobs?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {(jobs ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing open at the moment.
              </p>
            </div>
          ) : (
            <div className="divide">
              {(jobs ?? []).map((job) => (
                <Link className="li linkrow" key={job.id} href={`/jobs/${job.id}`}>
                  <div>
                    <span className="chip chip-blue">{kindLabel[job.kind] ?? job.kind}</span>{" "}
                    <b>{job.title}</b>
                    <div className="muted small">
                      {people?.find((p) => p.id === job.poster_id)?.full_name ??
                        "A member"}
                      . {job.location ?? "Location not given"}
                      {job.remote ? ", remote possible" : ""}.{" "}
                      {timeAgo(job.created_at)}.
                    </div>
                  </div>
                  <div className="rowmeta">
                    {job.compensation ? (
                      <span className="chip">{job.compensation}</span>
                    ) : null}
                    {job.reach === "all_villages" ? (
                      <span className="chip">Every Village</span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}