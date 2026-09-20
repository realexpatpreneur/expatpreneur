import { WorkspaceShell } from "@/components/workspace-shell";
import { requireMember } from "@/lib/member";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, your teaching" };

export default async function EducatorMorePage() {
  await requireMember("/educator/more");

  return (
    <WorkspaceShell kind="edu" nav="/educator/more">
        <section className="sec">
          <h1>More</h1>
        </section>
        <section className="sec">
          <MenuList
            items={[
              ["/educator", "Overview and your courses"],
              ["/educator/learners", "Learners"],
              ["/educator/sales", "Sales"],
              ["/educator/payouts", "Payouts"],
              ["/educator/profile", "Educator profile"],
              ["/learning", "The catalogue"],
              ["/home", "Back to member view"],
            ]}
          />
        </section>
      </WorkspaceShell>
  );
}