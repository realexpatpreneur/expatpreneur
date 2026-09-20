import Link from "next/link";

// The prototype's footer: the network in one column, what is here in the
// others, and the small print underneath.
export function SiteFooter() {
  return (
    <footer className="site">
      <div className="cols-foot">
        <div>
          <b>ExpatPreneurs Global</b>
          <p className="small" style={{ color: "#c9d6e2", maxWidth: "28ch" }}>
            A curated network of expat entrepreneurs, organised as Villages in
            each city.
          </p>
        </div>

        <div>
          <b>The network</b>
          <Link href="/discover">Discover</Link>
          <Link href="/villages">Villages</Link>
          <Link href="/members">Members</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/membership">Membership</Link>
        </div>

        <div>
          <b>What is here</b>
          <Link href="/events">Events</Link>
          <Link href="/businesses">Businesses</Link>
          <Link href="/learning">Learning</Link>
          <Link href="/watch">Watch and Listen</Link>
          <Link href="/media">Media</Link>
        </div>

        <div>
          <b>Joining</b>
          <Link href="/apply">Request an invitation</Link>
          <Link href="/apply/status">Where your request stands</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>

      <div className="bottom">
        <span>ExpatPreneurs Global</span>
        <span>
          <Link href="/legal/terms">Terms of service</Link>
          {" · "}
          <Link href="/legal/privacy">Privacy policy</Link>
        </span>
      </div>
    </footer>
  );
}