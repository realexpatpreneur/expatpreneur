import Link from "next/link";
import { currentMember } from "@/lib/member";
import { Ic } from "@/components/icon";
import { Logo } from "@/components/brand";
import { Av } from "@/components/bits";

const PUBNAV: [string, string][] = [
  ["/discover", "Discover"],
  ["/how-it-works", "How it works"],
  ["/membership", "Membership"],
  ["/events", "Events"],
  ["/watch", "Watch & Listen"],
];

// The header, on every page of the site. Signed out it offers the way
// in; signed in it offers the way to your own pages. The links across
// the middle never change, so the site is always navigable from the top.
export async function SiteHeader() {
  const member = await currentMember();
  const user = member;
  const name = member?.full_name ?? null;

  return (
    <header className="pubhead">
      <div className="in">
        {/* The wordmark is the site, so it always goes to the front door.
            Getting into the member area is a deliberate move, which is
            what Your home beside it is for. */}
        <Logo href="/" />

        <nav className="pubnav">
          {PUBNAV.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        {user ? (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/search">
              <Ic name="search" />
            </Link>
            <Link className="loginlink hide-m" href="/home" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Your home
            </Link>
            <Link className="btn btn-ghost btn-sm hide-m" href="/my-village">
              Your Village
            </Link>
            <Link href="/me" aria-label={name ?? "You"}>
              <Av name={name ?? "You"} className="av-sm" />
            </Link>
          </>
        ) : (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/discover">
              <Ic name="search" />
            </Link>
            <Link className="loginlink" href="/login" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Log in
            </Link>
            <Link className="btn btn-primary btn-sm hide-m" href="/apply">
              Request your invitation
            </Link>
          </>
        )}

        <Link className="iconbtn menubtn" aria-label="Menu" href={user ? "/more" : "/menu"}>
          <Ic name="menu" />
        </Link>
      </div>
    </header>
  );
}