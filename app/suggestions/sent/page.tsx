import { PublicPage } from "@/components/public-page";
import Link from "next/link";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function SuggestionSentPage({
  searchParams,
}: {
  searchParams: Promise<{ how?: string }>;
}) {
  const { how } = await searchParams;
  const anonymous = how === "anonymous";

  return (
    <PublicPage>
        <section className="sec">
          <h1>Thank you</h1>
          <p className="lead">
            {anonymous
              ? "Your suggestion is with the team. It carries no name, so nobody can reply to it, and nobody can trace it back to you."
              : "Your suggestion is with the team. You will hear what happens with it."}
          </p>
          <p>
            <Link className="btn btn-ghost" href="/suggestions">
              Send another
            </Link>{" "}
            <Link className="btn btn-primary" href="/home">
              Back to home
            </Link>
          </p>
        </section>
      </PublicPage>
  );
}