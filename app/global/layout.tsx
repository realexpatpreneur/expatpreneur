import Link from "next/link";
import { requireGlobal } from "@/lib/access";
import { WorkspaceNav } from "@/components/workspace-nav";

export const metadata = { title: "Global team, ExpatPreneurs Global" };

// The prototype groups the Global workspace four ways. Same grouping.
const groups = [
  {
    heading: "Network",
    links: [
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
      ["/global/suggestions", "Suggestions"],
    ] as [string, string][],
  },
  {
    heading: "Content",
    links: [
      ["/global/content", "Pages"],
      ["/global/media", "Articles"],
      ["/global/photos", "Photos and consent"],
      ["/global/library", "Resources library"],
      ["/admin/media", "Watch and Listen"],
      ["/global/emails", "Emails"],
    ] as [string, string][],
  },
  {
    heading: "Money and marketplaces",
    links: [
      ["/global/money", "Payments and tickets"],
      ["/global/recognition", "Team recognition"],
      ["/global/learning", "Educators and courses"],
      ["/global/businesses", "Business listings"],
      ["/global/partners", "Partnered events"],
      ["/global/markets", "Market pathways"],
    ] as [string, string][],
  },
  {
    heading: "Insight",
    links: [
      ["/global/reporting", "Analytics"],
      ["/global/network", "Network intelligence"],
      ["/global/audit", "Audit log"],
      ["/global/settings", "System settings"],
      ["/global/more", "More"],
    ] as [string, string][],
  },
];

export default async function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGlobal();

  return (
    <>
      <header className="top">
        <Link className="brand" href="/global">
          ExpatPreneurs <span className="chip">Global</span>
        </Link>
        <nav>
          <Link className="hide-small" href="/admin">
            Village view
          </Link>
          <Link className="btn only-small" href="/global/more">
            Menu
          </Link>
          <Link className="btn" href="/home">
            Member view
          </Link>
        </nav>
      </header>

      <WorkspaceNav
        title="The Global team"
        subtitle="Every Village"
        groups={groups}
      />

      {children}
    </>
  );
}