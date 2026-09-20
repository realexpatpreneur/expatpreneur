import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { BusinessForm } from "../forms";

export const metadata = { title: "Add your business" };

export default async function NewBusinessPage() {
  const member = await requireMember("/businesses/new");
  const supabase = await createClient();

  // Editing is the same form, so an existing business opens here filled in.
  const { data: existing } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", member.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return (
    <WorkspaceShell kind="member" nav="/businesses/new">
        <section className="sec">
          <p className="muted small">
            <Link href="/businesses">Businesses</Link>
          </p>
          <h1>{existing ? "Your business" : "Add your business"}</h1>
          <p className="lead">
            Plainly written and specific beats polished. Members are reading it
            to work out whether to introduce you to someone.
          </p>
        </section>
        <section className="sec">
          <BusinessForm business={existing ?? undefined} />
        </section>
      </WorkspaceShell>
  );
}