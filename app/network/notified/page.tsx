import { WorkspaceShell } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { Done } from "@/components/done";

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
      <section className="sec">
        <Done
          title="We will let you know"
          icon="bell"
          actions={[
            { label: "Back to the network", href: "/network", kind: "primary" },
          ]}
        >
          You will get a notification when the {row?.name ?? "next"} Village
          opens.
        </Done>
      </section>
    </WorkspaceShell>
  );
}