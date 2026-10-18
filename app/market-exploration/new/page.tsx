import { WorkspaceShell } from "@/components/workspace-shell";
import { requireMember } from "@/lib/member";
import { MarketPostForm } from "../forms";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Post a market question" };

export default async function NewMarketPostPage() {
  await requireMember("/market-exploration/new");

  return (
    <WorkspaceShell kind="member" nav="/market-exploration/new">
        <section className="sec">
          <Crumbs trail={[["Market Exploration", "/market-exploration"], ["Post a market question"]]} />
          <h1>Post a market question</h1>
          <p className="lead">
            The people who know that market are often in another Village. This
            reaches all of them.
          </p>
        </section>
        <section className="sec">
          <MarketPostForm />
        </section>
      </WorkspaceShell>
  );
}