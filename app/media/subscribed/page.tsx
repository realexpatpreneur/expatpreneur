import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";

export const metadata = { title: "You are on the list, ExpatPreneurs Global" };

export default function SubscribedPage() {
  return (
    <PublicPage>
      <main className="wrap">
        <section className="pubsec">
          <Done
            title="You are on the list"
            icon="mail"
            actions={[{ label: "Back to Media", href: "/media", kind: "primary" }]}
          >
            The next one comes to you. Every email we send has a way off it
            at the bottom.
          </Done>
        </section>
      </main>
    </PublicPage>
  );
}