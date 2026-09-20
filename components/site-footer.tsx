import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="inner">
          <span className="brand">ExpatPreneurs</span>
          <div className="links">
            <Link href="/discover">Discover</Link>
            <Link href="/membership">Membership</Link>
            <Link href="/members">Members</Link>
            <Link href="/learning">Learning</Link>
            <Link href="/businesses">Businesses</Link>
            <Link href="/apply/status">Your request</Link>
            <Link href="/legal/terms">Terms of service</Link>
            <Link href="/legal/privacy">Privacy policy</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}