import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, your teaching" };

export default async function EducatorMorePage() {
  await requireMember("/educator/more");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>More</h1>
        </section>
        <section className="band">
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
      </main>
    </>
  );
}