import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function SuggestionSentPage({
  searchParams,
}: {
  searchParams: Promise<{ how?: string }>;
}) {
  const { how } = await searchParams;
  const anonymous = how === "anonymous";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Thank you</h1>
          <p className="lead">
            {anonymous
              ? "Your suggestion is with the team. It carries no name, so nobody can reply to it, and nobody can trace it back to you."
              : "Your suggestion is with the team. You will hear what happens with it."}
          </p>
          <p>
            <Link className="btn" href="/suggestions">
              Send another
            </Link>{" "}
            <Link className="btn primary" href="/home">
              Back to home
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}