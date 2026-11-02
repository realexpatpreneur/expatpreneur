import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";

export const metadata = { title: "Privacy policy, ExpatPreneurs Global" };

// The three legal pages sit together, as the prototype has them, so
// somebody reading one can find the other two. Inlined here, and in its
// two siblings, because these pages now carry the public site's design.
const LEGAL: [string, string][] = [
  ["/legal/privacy", "Privacy"],
  ["/legal/terms", "Terms"],
  ["/legal/cookies", "Cookies"],
];

const HERE = "/legal/privacy";

// The prose rows: a hairline between clauses, the heading and its
// paragraph held to a reading measure, and the number in the margin.
const SECTION = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0,1fr)",
  gap: 20,
  padding: "26px 0",
  borderTop: "1px solid #E3E6EA",
} as const;
const NUM = { fontSize: 34, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1, color: "#C7CDD4" } as const;
const HEAD = { fontSize: 19, fontWeight: 700 } as const;
const PROSE = { marginTop: 10, fontSize: 16, lineHeight: 1.75, maxWidth: "68ch" } as const;

// Draft only. It describes what the platform actually does today, which is
// the right starting point for the lawyer rather than a generic template.
export default async function PrivacyPage() {
  // A published page replaces what is written below.
  const page = await livePage("privacy");

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
            <h1 className="d-h1" style={{ marginTop: 44, maxWidth: "18ch" }}>Privacy policy</h1>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
              What we hold, why we hold it, and who can see it.
            </p>
            <div
              className="d-card-paper"
              style={{ marginTop: 32, maxWidth: 620, padding: "18px 22px", borderLeft: "4px solid #F2A65A" }}
            >
              <p className="d-body">
                Draft. It matches what the platform does today. The entity, the
                contact address and the retention periods are still to be confirmed.
              </p>
            </div>
          </div>
        </section>

        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <ol style={{ maxWidth: 840, borderBottom: "1px solid #E3E6EA" }}>
              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>01</span>
                <div>
                  <h3 style={HEAD}>What we collect</h3>
                  <p className="d-body" style={PROSE}>
                    What you give us when you request an invitation: your name, email,
                    phone, city, business, industry, nationalities, languages and your
                    answers. Later, what you choose to put on your profile, what you
                    post, who you message, and which events you register for.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>02</span>
                <div>
                  <h3 style={HEAD}>Why</h3>
                  <p className="d-body" style={PROSE}>
                    To decide on your request, to place you in a Village and a Circle,
                    to run the community, and to keep the balance of each Village. We
                    do not sell anything to anyone, and we do not advertise to you.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>03</span>
                <div>
                  <h3 style={HEAD}>Who sees what</h3>
                  <p className="d-body" style={PROSE}>
                    Members see your profile as you chose to show it. The public sees
                    only what you marked as public, and never your email, your phone
                    or what you wrote for us. Your Local Admin sees your member
                    record. The Global team sees all Villages.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>04</span>
                <div>
                  <h3 style={HEAD}>Nationalities</h3>
                  <p className="d-body" style={PROSE}>
                    We ask because a Village works better when it is mixed. It is used
                    inside the admin workspaces only, never shown to members, and
                    never a reason we give to anyone.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>05</span>
                <div>
                  <h3 style={HEAD}>Anonymous suggestions</h3>
                  <p className="d-body" style={PROSE}>
                    When you send a suggestion anonymously, no identifier is stored
                    with it. Nobody, including us, can trace it back to you.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>06</span>
                <div>
                  <h3 style={HEAD}>Where it lives</h3>
                  <p className="d-body" style={PROSE}>
                    On Supabase and Vercel. Payments are handled by Stripe, who hold
                    the card details; we never see them.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>07</span>
                <div>
                  <h3 style={HEAD}>Your rights</h3>
                  <p className="d-body" style={PROSE}>
                    You can ask for a copy of what we hold, correct it, or ask us to
                    delete it. Write to [contact address]. If you are in the European
                    Union you can also complain to your data protection authority.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>08</span>
                <div>
                  <h3 style={HEAD}>How long</h3>
                  <p className="d-body" style={PROSE}>
                    While you are a member, and for [period] afterwards. Declined
                    requests are kept for [period] so we can recognise a repeat
                    application.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
