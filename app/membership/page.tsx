import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Membership, ExpatPreneurs Global",
  description:
    "Membership is by invitation and costs nothing. The paid plan opens the rest of the network.",
};

export default function MembershipPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Membership</h1>
          <p className="lead">
            Membership is by invitation and costs nothing. One paid plan opens
            the rest of the network to you.
          </p>
        </section>

        <section className="band">
          <div className="two">
            <div className="panel">
              <h3>Member</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Free, for as long as you are here. It comes with an accepted
                invitation.
              </p>
              <ul>
                <li>Your Village, your Circle and its WhatsApp group</li>
                <li>Ask and Offer in your own Village</li>
                <li>The Directory of your Village</li>
                <li>Your Village&apos;s events and resources</li>
                <li>Reading every Market Exploration post</li>
                <li>The suggestion box</li>
              </ul>
              <p style={{ marginTop: 14 }}>
                <Link className="btn primary" href="/apply">
                  Request an invitation
                </Link>
              </p>
            </div>

            <div className="panel wash">
              <h3>Paid member</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                The one paid plan. Members take it when their business starts
                needing the other cities, not before.
              </p>
              <ul>
                <li>Replying to members in any Village</li>
                <li>Asking to connect, and messaging once they accept</li>
                <li>The Directory of every Village</li>
                <li>Events in other Villages, as a visiting member</li>
                <li>Resources from every Village</li>
              </ul>
              <p className="muted small" style={{ marginTop: 14 }}>
                The price is shown when you are signed in, and you can change
                or cancel it yourself at any time.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>How people get in</h2>
          <div className="two">
            <div className="panel">
              <h3>Somebody reads every request</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                A request goes to the Local Admins of the city you named. They
                read it, and the Global team makes the final decision. It takes
                days rather than minutes, and you hear either way.
              </p>
            </div>
            <div className="panel">
              <h3>Why it is not open</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                A Circle is fifty people who are meant to know each other. That
                only works if somebody is deciding who joins, and if the mix of
                nationalities in a Village stays wide.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>What it is not</h2>
          <div className="two">
            <div className="panel">
              <h3>Not a lead list</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Members do not pitch each other. What happens instead is
                introductions, which is slower and works better.
              </p>
            </div>
            <div className="panel">
              <h3>Not a feed</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                There is nothing here to scroll. People ask for what they need,
                somebody answers, and most of it ends up happening in person.
              </p>
            </div>
          </div>
        </section>

        <section className="band cta">
          <h2>If that sounds like you</h2>
          <p className="lead">
            Tell us where you are and what you are building. It takes ten
            minutes.
          </p>
          <p>
            <Link className="btn primary" href="/apply">
              Request an invitation
            </Link>{" "}
            <Link className="btn" href="/discover">
              Look around first
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}