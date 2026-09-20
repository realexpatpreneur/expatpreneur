import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { ReportForm } from "./form";

export const metadata = { title: "Report something, ExpatPreneurs Global" };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; done?: string }>;
}) {
  const { member: subjectId, done } = await searchParams;
  const me = await requireMember("/report");
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("status", "active")
    .neq("id", me.id)
    .order("full_name")
    .limit(200);

  return (
    <WorkspaceShell kind="member" nav="/report">
        <section className="sec">
          <h1>Report something</h1>
          <p className="lead">
            If something happened that should not have, tell us. It is handled
            quietly.
          </p>
        </section>

        <section className="sec">
          {done ? (
            <div className="panel" style={{ maxWidth: 680 }}>
              <h3>It is with us</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Your Local Admins and the Global team can see it. They will come
                back to you. The person it is about is never told who reported
                it.
              </p>
              <Link className="btn btn-ghost" href="/home">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="gside">
              <ReportForm people={people ?? []} subjectId={subjectId} />
              <div className="stack">
                <div className="panel">
                  <h3>What happens next</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    A Local Admin reads it, speaks to the people involved, and
                    records what was done. Anything serious goes to the Global
                    team. A membership can end over this.
                  </p>
                </div>
                <div className="panel panel-wash">
                  <h3>This is not the suggestion box</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Ideas for making the community better belong there, and can
                    be sent anonymously.
                  </p>
                  <Link className="btn btn-ghost" href="/suggestions">
                    Suggestion box
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}