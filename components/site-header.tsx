import Link from "next/link";
import { MemberNav } from "@/components/member-nav";

// The public header, as the prototype draws it: the mark, the wordmark
// with Global in blue, the navigation to the left, then search, sign in
// and the navy invitation pill.
export async function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
      <header className="top">
        <Link className="brand" href={signedIn ? "/home" : "/"}>
          <span className="mark">EP</span>
          <span>
            ExpatPreneurs <small>Global</small>
          </span>
        </Link>

        {signedIn ? null : (
          <nav className="pubnav">
            <Link href="/discover">Discover</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/membership">Membership</Link>
            <Link href="/events">Events</Link>
            <Link href="/watch">Watch and Listen</Link>
          </nav>
        )}

        <nav>
          <Link className="btn only-small" href={signedIn ? "/more" : "/menu"}>
            Menu
          </Link>
          {signedIn ? (
            <>
              <Link className="iconbtn hide-small" href="/search" aria-label="Search">
                Search
              </Link>
              <Link className="hide-small" href="/notifications">
                Notifications
              </Link>
              <Link className="btn" href="/settings">
                You
              </Link>
            </>
          ) : (
            <>
              <Link className="iconbtn hide-small" href="/discover" aria-label="Search">
                Search
              </Link>
              <Link className="hide-small" href="/login">
                Log in
              </Link>
              <Link className="btn dark" href="/apply">
                Request your invitation
              </Link>
            </>
          )}
        </nav>
      </header>

      {signedIn ? <MemberNav /> : null}
    </>
  );
}