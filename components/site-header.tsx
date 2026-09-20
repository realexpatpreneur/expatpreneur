import Link from "next/link";
import { Ic } from "@/components/icon";
import { Logo } from "@/components/brand";

const PUBNAV: [string, string][] = [
  ["/discover", "Discover"],
  ["/how-it-works", "How it works"],
  ["/membership", "Membership"],
  ["/events", "Events"],
  ["/watch", "Watch & Listen"],
];

// pubHead, as the prototype writes it.
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="pubhead">
      <div className="in">
        <Logo href="/" />
        <nav className="pubnav">
          {PUBNAV.map(([href, label]) => (
            <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="iconbtn" aria-label="Search" href="/discover">
          <Ic name="search" />
        </Link>
        <Link className="loginlink" href="/login" style={{ fontWeight: 600, color: "var(--navy)" }}>
          Log in
        </Link>
        <Link className="btn btn-primary btn-sm hide-m" href="/apply">
          Request your invitation
        </Link>
        <Link className="iconbtn menubtn" aria-label="Menu" href="/menu">
          <Ic name="menu" />
        </Link>
      </div>
    </header>
  );
}