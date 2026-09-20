import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MenuList } from "@/components/menu-list";

export const metadata = { title: "Menu, ExpatPreneurs Global" };

// The menu that opens from the menu button on small screens.
export default function PublicMenuPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="sec">
          <h1>Menu</h1>
        </section>
        <section className="sec">
          <MenuList
            items={[
              ["/discover", "Discover"],
              ["/how-it-works", "How it works"],
              ["/membership", "Membership"],
              ["/villages", "Villages"],
              ["/members", "Members"],
              ["/businesses", "Businesses"],
              ["/learning", "Learning"],
              ["/events", "Events"],
              ["/watch", "Watch and Listen"],
              ["/watch/show/expatpreneurs", "Podcasts"],
              ["/media", "Media"],
              ["/apply", "Request your invitation"],
              ["/apply/status", "Where your request stands"],
              ["/login", "Sign in"],
              ["/contact", "Contact"],
            ]}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}