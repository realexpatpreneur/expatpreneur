import Link from "next/link";
import { requireAdmin } from "@/lib/access";

export const metadata = { title: "Local Admin, ExpatPreneurs Global" };

// Thirteen links across one line was too many. They are grouped now: the
// people, what is on, and what there is to read.
const groups = [
  {
    heading: "People",
    links: [
      ["/admin", "Overview"],
      ["/admin/applications", "Requests"],
      ["/admin/members", "Members"],
      ["/admin/circles", "Circles"],
      ["/admin/care", "Care"],
      ["/admin/whatsapp", "WhatsApp"],
      ["/admin/transfers", "Moves"],
      ["/admin/mix", "Village mix"],
      ["/admin/leadership", "Leadership"],
    ],
  },
  {
    heading: "What is on",
    links: [
      ["/admin/events", "Events"],
      ["/admin/live", "Live rooms"],
      ["/admin/announcements", "Announcements"],
      ["/admin/partners", "Partnered events"],
    ],
  },
  {
    heading: "What there is to read",
    links: [
      ["/admin/resources", "Resources"],
      ["/admin/media", "Watch and Listen"],
    ],
  },
  {
    heading: "Listening",
    links: [
      ["/admin/reports", "Reports"],
      ["/admin/suggestions", "Suggestion box"],
      ["/admin/insight", "Insight"],
      ["/admin/settings", "Village settings"],
    ],
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
        <Link className="brand" href="/admin/applications">
          ExpatPreneurs <span className="chip">Admin</span>
        </Link>
        <nav>
          {admin.isGlobal ? <Link href="/global">Global team</Link> : null}
          <Link href="/lead">What you run</Link>
          <Link className="btn" href="/home">
            Member view
          </Link>
        </nav>
      </header>

      <div className="wrap">
        <div className="adminnav">
          {groups.map((group) => (
            <div key={group.heading}>
              <span className="muted small">{group.heading}</span>
              <div className="tabs">
                {group.links.map(([href, label]) => (
                  <Link className="chip" key={href} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="muted small">
          {admin.isGlobal ? "Global team, every Village" : "Local Admin"}
        </p>
      </div>

      {children}
    </>
  );
}