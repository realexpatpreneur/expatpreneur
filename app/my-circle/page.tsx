import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { requireMember } from "@/lib/member";

export const metadata = { title: "Your Circle, ExpatPreneurs Global" };

// A steady address for whichever Circle you are in, so nothing has to
// know its identifier to link to it. Two pages were already pointing
// here and getting a 404.
export default async function MyCirclePage() {
  const member = await requireMember("/my-circle");

  if (member.circle_id) redirect(`/circles/${member.circle_id}`);

  return (
    <WorkspaceShell kind="member">
      <PageHead
        title="You are not in a Circle yet"
        sub="Your Local Admin places you in one, usually within a few days of joining."
      />
      <div className="panel panel-wash" style={{ maxWidth: 620 }}>
        <p className="muted small" style={{ margin: 0 }}>
          A Circle is your home base: up to fifty members who meet, ask and
          answer each other. Until you are placed in one, the Village is open
          to you and so is everything in it.
        </p>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/my-village">
            Your Village
          </Link>
          <Link className="btn btn-ghost" href="/my-village/circles">
            The Circles here
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}