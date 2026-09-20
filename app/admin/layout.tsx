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
          <Link href="/admin/applications">Invitation requests</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/suggestions">Suggestion box</Link>
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