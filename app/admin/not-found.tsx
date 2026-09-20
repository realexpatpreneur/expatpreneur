import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";

// Inside the workspace the layout already supplies the rail, the sidebar
// and the top bar, so this is only the page itself.
export default function AdminNotFound() {
  return (
    <>
      <PageHead
        title="That page is not here"
        sub="It may have moved, or the record may have been removed."
      />
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/admin">
          Back to the overview
        </Link>
        <Link className="btn btn-ghost" href="/admin/members">
          Members
        </Link>
      </div>
    </>
  );
}