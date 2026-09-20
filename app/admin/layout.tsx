import Link from "next/link";
import { requireAdmin } from "@/lib/access";
import { WorkspaceNav } from "@/components/workspace-nav";

export const metadata = { title: "Local Admin, ExpatPreneurs Global" };

const groups = [
  {
    heading: "People",
    links: [
      ["/admin", "Overview"],
      ["/admin/applications", "Invitation requests"],
      ["/admin/members", "Members"],
      ["/admin/circles", "Circles"],
      ["/admin/care", "Member care"],
      ["/admin/whatsapp", "WhatsApp sync"],
      ["/admin/transfers", "Moves"],
      ["/admin/mix", "Village mix"],
      ["/admin/leadership", "Leadership"],
    ] as [string, string][],
  },
  {
    heading: "What is on",
    links: [
      ["/admin/events", "Events"],
      ["/admin/live", "Live rooms"],
      ["/admin/announcements", "Announcements"],
      ["/admin/partners", "Partnered events"],
    ] as [string, string][],
  },
  {
    heading: "What there is to read",
    links: [
      ["/admin/resources", "Resources"],
      ["/admin/media", "Watch and Listen"],
    ] as [string, string][],
  },
  {
    heading: "Listening",
    links: [
      ["/admin/reports", "Reports"],
      ["/admin/suggestions", "Suggestion box"],
      ["/admin/insight", "Insight"],
      ["/admin/settings", "Village settings"],
      ["/admin/more", "More"],
    ] as [string, string][],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="top">
        <Link className="brand" href="/admin">
          ExpatPreneurs <span className="chip">Admin</span>
        </Link>
        <nav>
          {admin.isGlobal ? (
            <Link className="hide-small" href="/global">
              Global team
            </Link>
          ) : null}
          <Link className="hide-small" href="/lead">
            What you run
          </Link>
          <Link className="btn only-small" href="/admin/more">
            Menu
          </Link>
          <Link className="btn" href="/home">
            Member view
          </Link>
        </nav>
      </header>

      <WorkspaceNav
        title={admin.isGlobal ? "Every Village" : "Your Village"}
        subtitle="Local Admin"
        groups={groups}
      />

      {children}
    </>
  );
}