import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";

export const metadata = { title: "Request received, ExpatPreneurs Global" };

export default async function ApplicationSentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <PublicPage>
      <main className="wrap">
        <section className="pubsec">
          <Done
            title="Request received"
            actions={[
              { label: "Check your request", href: "/apply/status", kind: "primary" },
              { label: "Come to an open evening", href: "/events" },
            ]}
            extra={
              ref ? (
                <p className="muted small" style={{ marginTop: 12 }}>
                  Your reference is <b>{ref}</b>. With the email address you
                  used, it shows you where your request stands at any point.
                </p>
              ) : null
            }
          >
            Your request is being read. Someone reads every one, and you will
            hear back by email. Most reviews take about a week.
          </Done>
        </section>
      </main>
    </PublicPage>
  );
}