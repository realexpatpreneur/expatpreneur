import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";

export const metadata = { title: "Terms of service, ExpatPreneurs Global" };

// The three legal pages sit together, as the prototype has them, so
// somebody reading one can find the other two.
const LEGAL: [string, string][] = [
  ["/legal/privacy", "Privacy"],
  ["/legal/terms", "Terms"],
  ["/legal/cookies", "Cookies"],
];

const HERE = "/legal/terms";

// The clauses here already carry their own numbers, so these rows sit
// flush instead of taking the numeral in the margin that Privacy and
// Cookies use.
const CLAUSE = { padding: "26px 0", borderTop: "1px solid #E3E6EA" } as const;
const HEAD = { fontSize: 19, fontWeight: 700 } as const;
const PROSE = { marginTop: 10, fontSize: 16, lineHeight: 1.75, maxWidth: "68ch" } as const;

// Draft only. The company details and the governing law are still
// placeholders, and a lawyer signs this off before launch. The fee clause
// no longer names a figure, because each Village is priced in its own
// currency and the membership page is where the current price is shown.
export default async function TermsPage() {
  // A published page replaces what is written below.
  const page = await livePage("terms");

  if (page) {
    return (
      <PublicPage>
        <main className="wrap">
          <Blocks blocks={page.blocks} />
        </main>
    </PublicPage>
    );
  }

  return (
    <PublicPage>
      <main className="d-page">
        <section style={{ padding: "40px 0 64px" }}>
          <div className="d-wrap">
            <nav className="d-tabs" aria-label="Legal">
              {LEGAL.map(([href, label]) => (
                <Link
                  key={href}
                  className={href === HERE ? "on" : ""}
                  href={href}
                  aria-current={href === HERE ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <h1 className="d-h1" style={{ marginTop: 44, maxWidth: "18ch" }}>Terms of service</h1>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
              The agreement between ExpatPreneurs Global and its members.
            </p>
            <div
              className="d-card-paper"
              style={{ marginTop: 32, maxWidth: 620, padding: "18px 22px", borderLeft: "4px solid #F2A65A" }}
            >
              <p className="d-body">
                Draft. Company details, governing law and fees are still to be
                confirmed, and this is reviewed before launch.
              </p>
            </div>
          </div>
        </section>

        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <ol style={{ maxWidth: 840, borderBottom: "1px solid #E3E6EA" }}>
              <li style={CLAUSE}>
                <h3 style={HEAD}>1. Who we are</h3>
                <p className="d-body" style={PROSE}>
                  ExpatPreneurs Global, [registered entity, registration number,
                  registered address].
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>2. Membership</h3>
                <p className="d-body" style={PROSE}>
                  Membership is by invitation and is personal to you. It cannot be
                  transferred, shared or sold. We may decline a request without
                  giving a reason, and we may end a membership where these terms or
                  the community rules are broken.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>3. The community rules</h3>
                <p className="d-body" style={PROSE}>
                  Members help before they sell. Members do not pitch in the groups
                  or in messages that were not invited. What is shared inside a
                  Circle stays inside it. Breaking these is the usual reason a
                  membership ends.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>4. What you put here</h3>
                <p className="d-body" style={PROSE}>
                  You keep what you write. You give us permission to show it to the
                  members it was meant for, and to keep it while your membership
                  lasts. You are responsible for what you post, and for having the
                  right to post it.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>5. Fees</h3>
                <p className="d-body" style={PROSE}>
                  Village Membership is priced in the currency of
                  your own Village and is shown on the membership page before you
                  pay. It renews automatically, and can be cancelled at any time,
                  running until the end of the period already paid for. Event
                  tickets are refundable as stated on the event.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>6. What we do not promise</h3>
                <p className="d-body" style={PROSE}>
                  We introduce people. We do not guarantee business, referrals,
                  revenue, or the conduct of any member. Advice from a member is
                  theirs, not ours, and does not replace professional advice.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>7. Ending it</h3>
                <p className="d-body" style={PROSE}>
                  You can leave at any time. We may suspend or end a membership for
                  conduct that harms other members, and we will say why unless
                  saying so would put someone at risk.
                </p>
              </li>

              <li style={CLAUSE}>
                <h3 style={HEAD}>8. Law</h3>
                <p className="d-body" style={PROSE}>
                  These terms are governed by the law of [jurisdiction], and the
                  courts of [jurisdiction] have exclusive jurisdiction.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
