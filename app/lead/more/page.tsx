import { WorkspaceShell } from "@/components/workspace-shell";
import { requireMember } from "@/lib/member";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, what you run" };

export default async function LeadMorePage() {
  await requireMember("/lead/more");

  return (
    <WorkspaceShell kind="lead" nav="/lead/more">
        <section className="sec">
          <h1>More</h1>
        </section>
        <section className="sec">
          <MenuList
            items={[
              ["/lead", "What you run"],
              ["/groups", "Industry Groups"],
              ["/pods", "Pods"],
              ["/live", "Live rooms"],
              ["/library", "Resources"],
              ["/home", "Back to member view"],
            ]}
          />
        </section>
      </WorkspaceShell>
  );
}