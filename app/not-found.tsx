import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { Ic } from "@/components/icon";

export const metadata = { title: "Not here, ExpatPreneurs Global" };

// Every page keeps its navigation, including this one. Without it a
// wrong address dropped people onto a bare page with no way back.
export default function NotFound() {
  return (
    <PublicPage>
      <section className="pubsec hero-center">
        <h1>That page is not here</h1>
        <p className="intro">
          It may have moved, or it may be something only members can open. Both
          are easy to sort out from here.
        </p>
        <div className="ctas" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/">
            Back to the start
          </Link>
          <Link className="btn btn-ghost" href="/discover">
            Look around
          </Link>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="g4 g3">
          {(
            [
              ["pin", "Villages", "Where the network already is.", "/villages"],
              ["cal", "Events", "What is on, and what is open to everyone.", "/events"],
              ["users", "Members", "The people who chose to be listed.", "/members"],
              ["lock", "Sign in", "If the page you wanted is for members.", "/login"],
            ] as const
          ).map(([icon, title, text, href]) => (
            <Link className="panel" href={href} key={title}>
              <Ic name={icon} style={{ color: "var(--blue)" }} />
              <h3 style={{ fontSize: 14, marginTop: 10 }}>{title}</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                {text}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}