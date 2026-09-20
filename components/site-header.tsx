import Link from "next/link";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="top">
      <Link className="brand" href="/">
        ExpatPreneurs
      </Link>
      <nav>
        <Link className="hide-small" href="/villages">
          Villages
        </Link>
        <Link className="hide-small" href="/how-it-works">
          How it works
        </Link>
        <Link className="hide-small" href="/watch">
          Watch
        </Link>
        {signedIn ? (
          <Link className="btn" href="/home">
            Member space
          </Link>
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
  );
}