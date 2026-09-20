import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Contact, ExpatPreneurs Global" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Contact</h1>
          <p className="lead">
            Most questions have a better door than this one.
          </p>
        </section>

        <section className="band">
          <div className="grid three">
            <div className="panel">
              <h3>You want to join</h3>
              <p className="muted small">
                Requesting an invitation is the way in. It is read by a person,
                not a filter.
              </p>
              <Link className="btn" href="/apply">
                Request an invitation
              </Link>
            </div>
            <div className="panel">
              <h3>Your city is not here</h3>
              <p className="muted small">
                Tell us where you are. Villages open where enough people ask.
              </p>
              <Link className="btn" href="/villages/suggest">
                Suggest a city
              </Link>
            </div>
            <div className="panel">
              <h3>You are already a member</h3>
              <p className="muted small">
                Your Local Admin is the fastest answer, and they are in your
                Village's WhatsApp group.
              </p>
              <Link className="btn" href="/home">
                Member space
              </Link>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="panel" style={{ maxWidth: 680 }}>
            <h3>Anything else</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Write to hello@expatpreneurs.com and someone will answer.
              Partnerships, press and speaking go to the same address.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}