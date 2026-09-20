import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { JobForm } from "../../businesses/forms";

export const metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const member = await requireMember("/jobs/new");
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", member.id)
    .order("name");

  return (
    <WorkspaceShell kind="member" nav="/jobs/new">
        <section className="sec">
          <p className="muted small">
            <Link href="/jobs">Jobs and freelance</Link>
          </p>
          <h1>Post something</h1>
          <p className="lead">
            Hiring, a project, or someone to build something with.
          </p>
        </section>
        <section className="sec">
          <JobForm businesses={businesses ?? []} villageName={member.villageName} />
        </section>
      </WorkspaceShell>
  );
}