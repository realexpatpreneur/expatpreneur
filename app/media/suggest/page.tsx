import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { requireMember } from "@/lib/member";
import { StoryForm } from "./form";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Suggest a story, ExpatPreneurs Global" };

export default async function SuggestStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  await requireMember("/media/suggest");

  return (
    <WorkspaceShell kind="member" nav="/media/suggest">
        <section className="sec">
          <Crumbs trail={[["Media", "/media"], ["Suggest a story"]]} />
          <h1>Suggest a story</h1>
          <p className="lead">
            The team reads every one. Nothing is written about a member
            without asking them first.
          </p>
        </section>

        <section className="sec">
          {done ? (
            <div className="panel">
              <h3>Thank you</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                It is with the team. If it fits something coming up, somebody
                will be in touch.
              </p>
              <Link className="btn btn-ghost" href="/media">
                Back to Media
              </Link>
            </div>
          ) : (
            <StoryForm />
          )}
        </section>
      </WorkspaceShell>
  );
}