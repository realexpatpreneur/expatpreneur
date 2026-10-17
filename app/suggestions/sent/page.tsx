import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function SuggestionSentPage({
  searchParams,
}: {
  searchParams: Promise<{ how?: string }>;
}) {
  const { how } = await searchParams;

  return (
    <PublicPage>
      <main className="wrap">
        <section className="pubsec">
          <Done
            title="Thank you"
            actions={[
              { label: "Back to home", href: "/home", kind: "primary" },
              { label: "Send another", href: "/suggestions" },
            ]}
          >
            {how === "anonymous"
              ? "Your suggestion is with the team, and nothing on it says who sent it."
              : "Your suggestion is with the team. They read every one."}
          </Done>
        </section>
      </main>
    </PublicPage>
  );
}