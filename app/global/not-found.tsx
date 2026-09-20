import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";

// The Global layout supplies the chrome; this is only the page.
export default function GlobalNotFound() {
  return (
    <>
      <PageHead
        title="That page is not here"
        sub="It may have moved, or the record may have been removed."
      />
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/global">
          Back to the overview
        </Link>
        <Link className="btn btn-ghost" href="/global/villages">
          Villages
        </Link>
      </div>
    </>
  );
}