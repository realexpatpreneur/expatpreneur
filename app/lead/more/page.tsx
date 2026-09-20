import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, what you run" };

export default async function LeadMorePage() {
  await requireMember("/lead/more");

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
              ["/lead", "What you run"],
              ["/groups", "Industry Groups"],
              ["/pods", "Pods"],
              ["/live", "Live rooms"],
              ["/library", "Resources"],
              ["/home", "Back to member view"],
            ]}
          />
        </section>
      </main>
    </>
  );
}