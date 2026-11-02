import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export const metadata = { title: "Menu, ExpatPreneurs Global" };

type MenuGroup = { title: string; items: [string, string][] };

const GROUPS: MenuGroup[] = [
  {
    title: "Explore",
    items: [
      ["/discover", "Discover"],
      ["/how-it-works", "How it works"],
      ["/membership", "Membership"],
      ["/villages", "Villages"],
      ["/members", "Members"],
    ],
  },
  {
    title: "Marketplace",
    items: [
      ["/businesses", "Businesses"],
      ["/learning", "Learning"],
    ],
  },
  {
    title: "Stories",
    items: [
      ["/events", "Events"],
      ["/watch", "Watch and Listen"],
      ["/watch/show/expatpreneurs", "Podcasts"],
      ["/media", "Media"],
    ],
  },
  {
    title: "Company",
    items: [
      ["/apply", "Request your invitation"],
      ["/apply/status", "Where your request stands"],
      ["/login", "Sign in"],
      ["/contact", "Contact"],
    ],
  },
];

// The rows carry the public site's design here rather than the shared
// menu list, which the member menus keep.
function Go() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// The menu that opens from the menu button on small screens.
export default function PublicMenuPage() {
  return (
    <PublicPage>
      <main className="d-page">
        <section style={{ padding: "56px 0 56px" }}>
          <div className="d-wrap">
            <p className="d-eyebrow">ExpatPreneurs Global</p>
            <h1 className="d-h1" style={{ marginTop: 16 }}>Menu</h1>
          </div>
        </section>

        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <div className="d-biz" style={{ rowGap: 64 }}>
              {GROUPS.map((group) => (
                <section key={group.title}>
                  <h2 className="d-eyebrow">{group.title}</h2>
                  <div className="d-rows" style={{ marginTop: 18 }}>
                    {group.items.map(([href, label]) => (
                      <Link
                        className="d-row"
                        key={href + label}
                        href={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          fontSize: 17,
                          fontWeight: 600,
                        }}
                      >
                        <span>{label}</span>
                        <Go />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
