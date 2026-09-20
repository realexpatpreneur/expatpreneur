import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
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
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/jobs">Jobs and freelance</Link>
          </p>
          <h1>Post something</h1>
          <p className="lead">
            Hiring, a project, or someone to build something with.
          </p>
        </section>
        <section className="band">
          <JobForm businesses={businesses ?? []} villageName={member.villageName} />
        </section>
      </main>
    </>
  );
}