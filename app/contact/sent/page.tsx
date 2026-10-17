import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";

export const metadata = { title: "Message sent, ExpatPreneurs Global" };

export default async function ContactSentPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "general" } = await searchParams;

  return (
    <PublicPage active="/contact">
      <main className="wrap">
        <section className="pubsec">
          <Done
            title="Thanks for getting in touch"
            actions={[{ label: "Back to home", href: "/", kind: "primary" }]}
          >
            {kind === "partnership"
              ? "Your message is with the Global team, who agree every partnership."
              : kind === "press"
                ? "Your request is with the Global team. They handle interviews and stories."
                : "Your message has reached the Global team. We will reply by email."}
          </Done>
        </section>
      </main>
    </PublicPage>
  );
}