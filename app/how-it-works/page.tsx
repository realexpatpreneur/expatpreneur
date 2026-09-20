import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "How it works, ExpatPreneurs Global" };

export default async function HowItWorksPage() {
  // A published page replaces what is written below.
  const page = await livePage("how");

  if (page) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <Blocks blocks={page.blocks} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="hero center">
          <h1>How it works</h1>
          <p className="lead">
            A small, trusted community in your city, and people you can trust in
            other markets.
          </p>
        </section>

        <section className="band">
          <div className="grid three">
            <div className="panel">
              <h3>Villages</h3>
              <p className="muted small">
                One per city. It opens where there are enough expat
                entrepreneurs, a language they share, and someone local to run
                it.
              </p>
            </div>
            <div className="panel">
              <h3>Circles</h3>
              <p className="muted small">
                Inside a Village, groups of up to fifty. Past fifty, people stop
                knowing each other, so the next Circle opens instead.
              </p>
            </div>
            <div className="panel">
              <h3>Invitation</h3>
              <p className="muted small">
                Every request is read by a person. The Local Admin decides, and
                you hear either way.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>What members actually do</h2>
          <div className="grid three">
            <div className="panel">
              <h3>Ask and Offer</h3>
              <p className="muted small">
                What you need this week, and what you can give. Licensing,
                hiring, suppliers, banking, anything.
              </p>
            </div>
            <div className="panel">
              <h3>Market Exploration</h3>
              <p className="muted small">
                Looking into a new country? Say who you need to meet, and it
                reaches every Village.
              </p>
            </div>
            <div className="panel">
              <h3>Events</h3>
              <p className="muted small">
                Dinners, roundtables and online sessions. Some are open to
                anyone, most are for members.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>What it costs</h2>
          <div className="cols">
            <div className="panel">
              <h3>Membership</h3>
              <p className="muted small">
                Free. Your Village, your Circle, Ask and Offer, the Directory,
                your Village's events and resources.
              </p>
            </div>
            <div className="panel">
              <h3>The paid plan</h3>
              <p className="muted small">
                Adds the rest of the network: replying to members in other
                Villages, reaching them directly, their events and their
                resources.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>The rules, in three lines</h2>
          <div className="panel" style={{ maxWidth: 760 }}>
            <p>We help before we sell.</p>
            <p>Nobody pitches in the groups.</p>
            <p style={{ marginBottom: 0 }}>
              What is said in the Circle stays in the Circle.
            </p>
          </div>
          <p style={{ marginTop: 20 }}>
            <Link className="btn primary" href="/apply">
              Request an invitation
            </Link>{" "}
            <Link className="btn" href="/villages">
              Find your Village
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}