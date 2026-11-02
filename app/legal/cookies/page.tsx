import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { PublicPage } from "@/components/public-page";

export const metadata = { title: "Cookie policy, ExpatPreneurs Global" };

// The three legal pages sit together, as the prototype has them, so
// somebody reading one can find the other two.
const LEGAL: [string, string][] = [
  ["/legal/privacy", "Privacy"],
  ["/legal/terms", "Terms"],
  ["/legal/cookies", "Cookies"],
];

const HERE = "/legal/cookies";

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

// Draft only. What it describes is what the platform actually sets
// today, which is the right starting point for the lawyer.
export default async function CookiesPage() {
  const page = await livePage("cookies");

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
            <h1 className="d-h1" style={{ marginTop: 44, maxWidth: "18ch" }}>Cookie policy</h1>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
              What we keep on your device, and why.
            </p>
            <div
              className="d-card-paper"
              style={{ marginTop: 32, maxWidth: 620, padding: "18px 22px", borderLeft: "4px solid #F2A65A" }}
            >
              <p className="d-body">
                Draft. It matches what the platform sets today. It is reviewed
                before launch.
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
                  <h3 style={HEAD}>Essential cookies</h3>
                  <p className="d-body" style={PROSE}>
                    One set by Supabase, which keeps you signed in and keeps the
                    session secure. Without it you would have to sign in on every
                    page. It cannot be switched off while you are using an account.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>02</span>
                <div>
                  <h3 style={HEAD}>Analytics</h3>
                  <p className="d-body" style={PROSE}>
                    Vercel counts page views to tell us which pages are used and how
                    quickly they load. It does not follow you to other sites and it
                    does not build a profile of you.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>03</span>
                <div>
                  <h3 style={HEAD}>Advertising</h3>
                  <p className="d-body" style={PROSE}>
                    None. We do not advertise to you and we do not let anyone else
                    advertise to you here.
                  </p>
                </div>
              </li>

              <li style={SECTION}>
                <span aria-hidden="true" style={NUM}>04</span>
                <div>
                  <h3 style={HEAD}>Your choice</h3>
                  <p className="d-body" style={PROSE}>
                    You can clear or block cookies in your browser. Blocking the
                    essential one will sign you out and keep you out.
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
