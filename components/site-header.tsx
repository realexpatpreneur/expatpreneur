import Link from "next/link";
import { MemberNav } from "@/components/member-nav";

export async function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
      <header className="top">
        <Link className="brand" href={signedIn ? "/home" : "/"}>
          ExpatPreneurs
        </Link>

        {signedIn ? null : (
          <nav className="pubnav">
            <Link className="hide-small" href="/discover">
              Discover
            </Link>
            <Link className="hide-small" href="/villages">
              Villages
            </Link>
            <Link className="hide-small" href="/how-it-works">
              How it works
            </Link>
            <Link className="hide-small" href="/businesses">
              Businesses
            </Link>
            <Link className="hide-small" href="/learning">
              Learning
            </Link>
            <Link className="hide-small" href="/media">
              Media
            </Link>
            <Link className="hide-small" href="/watch">
              Watch and Listen
            </Link>
          </nav>
        )}

        <nav>
          <Link className="btn only-small" href={signedIn ? "/more" : "/menu"}>
            Menu
          </Link>
          {signedIn ? (
            <>
              <Link className="hide-small" href="/search">
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
              <Link href="/login">Log in</Link>
              <Link className="btn primary" href="/apply">
                Request an invitation
              </Link>
            </>
          )}
        </nav>
      </header>

      {signedIn ? <MemberNav /> : null}
    </>
  );
}