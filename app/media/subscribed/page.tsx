import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";

export const metadata = { title: "Check your inbox, ExpatPreneurs Global" };

export default function SubscribedPage() {
  return (
    <PublicPage>
      <main className="wrap">
        <section className="pubsec">
          <Done
            title="Check your inbox"
            icon="mail"
            actions={[{ label: "Back to Media", href: "/media", kind: "primary" }]}
          >
            Confirm your email address to start receiving the newsletter.
          </Done>
        </section>
      </main>
    </PublicPage>
  );
}