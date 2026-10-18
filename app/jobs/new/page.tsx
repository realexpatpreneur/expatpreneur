import { WorkspaceShell } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { JobForm } from "../../businesses/forms";
import { Crumbs } from "@/components/crumbs";

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
          <Crumbs trail={[["Jobs and freelance", "/jobs"], ["Post something"]]} />
          <h1>Post a job</h1>
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