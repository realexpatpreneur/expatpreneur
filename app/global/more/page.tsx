import { requireGlobal } from "@/lib/access";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "More, the Global team" };

export default async function GlobalMorePage() {
  await requireGlobal();

  return (
    <main className="wrap">
        <section className="sec">
          <h1>More</h1>
        </section>
        <section className="sec">
          <MenuList
            items={[
              ["/global", "Overview"],
              ["/admin/applications", "Invitation requests"],
              ["/global/villages", "Villages"],
              ["/global/events", "Events"],
              ["/global/cities", "City suggestions"],
              ["/admin/members", "Members and roles"],
              ["/global/roles", "Permissions"],
              ["/global/plans", "Plans and benefits"],
              ["/global/mix", "Nationality limits"],
              ["/global/groups", "Groups and Pods"],
              ["/global/requests", "Requests"],
              ["/global/moderation", "Moderation"],
              ["/global/content", "Pages"],
              ["/global/media", "Articles"],
              ["/global/photos", "Photos and consent"],
              ["/global/library", "Resources library"],
              ["/admin/media", "Watch and Listen"],
              ["/global/emails", "Emails"],
              ["/global/money", "Payments and tickets"],
              ["/global/recognition", "Team recognition"],
              ["/global/learning", "Educators and courses"],
              ["/global/businesses", "Business listings"],
              ["/global/partners", "Partnered events"],
              ["/global/markets", "Market pathways"],
              ["/global/reporting", "Analytics"],
              ["/global/network", "Network intelligence"],
              ["/global/audit", "Audit log"],
              ["/global/settings", "System settings"],
              ["/global/suggestions", "Suggestions"],
              ["/notifications", "Notifications"],
              ["/home", "Back to member view"],
            ]}
          />
        </section>
    </main>
  );
}