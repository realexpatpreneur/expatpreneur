import Link from "next/link";
import { requireGlobal } from "@/lib/access";

export const metadata = { title: "Global team, ExpatPreneurs Global" };

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
          <Link href="/global">Overview</Link>
          <Link href="/global/villages">Villages</Link>
          <Link href="/global/mix">Balance</Link>
          <Link href="/global/cities">Cities</Link>
          <Link href="/global/groups">Groups</Link>
          <Link href="/global/markets">Markets</Link>
          <Link href="/global/media">Media</Link>
          <Link href="/global/roles">Roles</Link>
          <Link href="/global/moderation">Moderation</Link>
          <Link href="/global/suggestions">Suggestions</Link>
          <Link href="/global/reporting">Reporting</Link>
          <Link href="/global/money">Money</Link>
          <Link className="btn" href="/admin/applications">
            Village view
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}