import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";

export const metadata = { title: "We will let you know, ExpatPreneurs Global" };

// Confirmation after asking to be told when a launching Village opens.
export default async function NotifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ village?: string }>;
}) {
  const { village } = await searchParams;
  await requireMember("/network");
  const supabase = await createClient();

  const { data: row } = village
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", village)
        .maybeSingle()
    : { data: null };

  return (
    <WorkspaceShell kind="member" nav="/network/notified">
        <section className="band">
          <h1>We will let you know</h1>
          <p className="lead">
            You will get a notification when the {row?.name ?? "next"} Village
            opens.
          </p>
          <p>
            <Link className="btn primary" href="/network">
              Back to the network
            </Link>
          </p>
        </section>
      </WorkspaceShell>
  );
}