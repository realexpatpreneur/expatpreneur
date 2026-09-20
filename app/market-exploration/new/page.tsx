import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { requireMember } from "@/lib/member";
import { MarketPostForm } from "../forms";

export const metadata = { title: "Post a market question" };

export default async function NewMarketPostPage() {
  await requireMember("/market-exploration/new");

  return (
    <WorkspaceShell kind="member" nav="/market-exploration/new">
        <section className="band">
          <p className="muted small">
            <Link href="/market-exploration">Market Exploration</Link>
          </p>
          <h1>Post a market question</h1>
          <p className="lead">
            The people who know that market are often in another Village. This
            reaches all of them.
          </p>
        </section>
        <section className="band">
          <MarketPostForm />
        </section>
      </WorkspaceShell>
  );
}