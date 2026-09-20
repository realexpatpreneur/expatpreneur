import Link from "next/link";
import { SubscribeForm } from "@/app/media/subscribe-form";

// The prototype's footer: the brand and the newsletter across the top,
// five columns of links, then the small print.
export function SiteFooter() {
  return (
    <footer className="site">
      <div className="ft-top">
        <div className="ft-brand">
          <span className="brand">
            <span className="mark">EP</span>
            <span>
              ExpatPreneurs <small>Global</small>
            </span>
          </span>
          <p>
            A curated network of expat entrepreneurs. Local enough to belong,
            global enough to grow, and human enough to matter.
          </p>
        </div>

        <div className="ft-news">
          <b>The monthly newsletter</b>
          <p>New stories, events and what is opening where, once a month.</p>
          <SubscribeForm source="footer" />
        </div>
      </div>

      <div className="ft-cols">
        <div>
          <h4>Explore</h4>
          <nav>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/membership">Membership</Link>
            <Link href="/members">Members</Link>
            <Link href="/events">Events</Link>
            <Link href="/apply">Request your invitation</Link>
            <Link href="/apply/status">Your invitation request</Link>
          </nav>
        </div>

        <div>
          <h4>Villages</h4>
          <nav>
            <Link href="/villages">All Villages</Link>
            <Link href="/villages/suggest">Suggest a city</Link>
            <Link href="/discover">Discover</Link>
          </nav>
        </div>

        <div>
          <h4>Marketplace</h4>
          <nav>
            <Link href="/businesses">Businesses</Link>
            <Link href="/jobs">Jobs and freelance</Link>
            <Link href="/learning">Learning</Link>
          </nav>
        </div>

        <div>
          <h4>Stories</h4>
          <nav>
            <Link href="/media">Media</Link>
            <Link href="/watch">Watch and Listen</Link>
            <Link href="/watch/show/expatpreneurs">Podcast</Link>
          </nav>
        </div>

        <div>
          <h4>Company</h4>
          <nav>
            <Link href="/contact">Contact</Link>
            <Link href="/login">Log in</Link>
            <Link href="/legal/terms">Terms of service</Link>
            <Link href="/legal/privacy">Privacy policy</Link>
          </nav>
        </div>
      </div>

      <div className="ft-bottom">
        <span>© {new Date().getFullYear()} ExpatPreneurs Global.</span>
        <span>
          <Link href="/legal/privacy">Privacy</Link>
          {" · "}
          <Link href="/legal/terms">Terms</Link>
        </span>
      </div>
    </footer>
  );
}