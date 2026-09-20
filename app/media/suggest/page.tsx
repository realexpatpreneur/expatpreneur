import Link from "next/link";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { StoryForm } from "./form";

export const metadata = { title: "Suggest a story, ExpatPreneurs Global" };

export default async function SuggestStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  await requireMember("/media/suggest");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/media">Media</Link>
          </p>
          <h1>Suggest a story</h1>
          <p className="lead">
            The team reads every one. Nothing is written about a member
            without asking them first.
          </p>
        </section>

        <section className="band">
          {done ? (
            <div className="panel">
              <h3>Thank you</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                It is with the team. If it fits something coming up, somebody
                will be in touch.
              </p>
              <Link className="btn" href="/media">
                Back to Media
              </Link>
            </div>
          ) : (
            <StoryForm />
          )}
        </section>
      </main>
    </>
  );
}