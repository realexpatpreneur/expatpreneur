import { requireAdmin } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, the Local Admin workspace" };

export default async function AdminMorePage() {
  await requireAdmin();

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
              ["/admin", "Overview"],
              ["/admin/applications", "Invitation requests"],
              ["/admin/members", "Members"],
              ["/admin/care", "Member care and re-enrolment"],
              ["/admin/circles", "Circles"],
              ["/admin/mix", "Village mix"],
              ["/admin/transfers", "Moves"],
              ["/admin/leadership", "Leadership"],
              ["/admin/events", "Events"],
              ["/admin/live", "Live rooms"],
              ["/admin/partners", "Partnered events"],
              ["/admin/announcements", "Announcements"],
              ["/admin/resources", "Resources"],
              ["/admin/media", "Watch and Listen"],
              ["/admin/reports", "Reports"],
              ["/admin/whatsapp", "WhatsApp sync"],
              ["/admin/suggestions", "Suggestion box"],
              ["/admin/insight", "Insight"],
              ["/admin/settings", "Village settings"],
              ["/notifications", "Notifications"],
              ["/home", "Back to member view"],
            ]}
          />
        </section>
      </main>
    </>
  );
}