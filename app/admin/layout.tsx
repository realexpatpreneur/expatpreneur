import Link from "next/link";
import { requireAdmin } from "@/lib/access";

export const metadata = { title: "Local Admin, ExpatPreneurs Global" };

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
          <Link href="/admin/applications">Requests</Link>
          <Link href="/admin/members">Members</Link>
          <Link href="/admin/circles">Circles</Link>
          <Link href="/admin/whatsapp">WhatsApp</Link>
          <Link href="/admin/announcements">Announcements</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/resources">Resources</Link>
          <Link href="/admin/media">Watch</Link>
          <Link href="/admin/suggestions">Suggestion box</Link>
          {admin.isGlobal ? <Link href="/global">Global team</Link> : null}
          <Link className="btn" href="/home">
            Member view
          </Link>
        </nav>
      </header>
      <div className="wrap">
        <p className="muted small">
          {admin.isGlobal
            ? "Global team, every Village"
            : "Local Admin"}
        </p>
      </div>
      {children}
    </>
  );
}