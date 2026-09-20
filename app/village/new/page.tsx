import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { requireMember } from "@/lib/member";
import { PostForm } from "../forms";

export const metadata = { title: "Post to Ask & Offer" };

export default async function NewPostPage() {
  const member = await requireMember("/village/new");

  return (
    <WorkspaceShell kind="member" nav="/village/new">
        <section className="sec">
          <p className="muted small">
            <Link href="/village">Ask &amp; Offer</Link>
          </p>
          <h1>Post something</h1>
          <p className="lead">
            Ask for what you need, or offer what you know. No pitching.
          </p>
        </section>
        <section className="sec">
          <PostForm villageName={member.villageName} />
        </section>
      </WorkspaceShell>
  );
}