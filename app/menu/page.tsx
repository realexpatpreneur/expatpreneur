import { PublicPage } from "@/components/public-page";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "Menu, ExpatPreneurs Global" };

// The menu that opens from the menu button on small screens.
export default function PublicMenuPage() {
  return (
    <PublicPage>
      <main className="wrap">
        <section className="sec">
          <p className="epm-eyebrow">ExpatPreneurs Global</p>
          <h1 className="epm-h1">Menu</h1>
        </section>
        <section className="sec">
          <MenuList
            groups={[
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
            ]}
          />
        </section>
      </main>
    </PublicPage>
  );
}
