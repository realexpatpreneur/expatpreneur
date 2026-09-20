import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

export const metadata = { title: "Message sent, ExpatPreneurs Global" };

export default async function ContactedPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const { b } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: business } = b
    ? await supabase
        .from("businesses")
        .select("slug, name")
        .eq("slug", b)
        .maybeSingle()
    : { data: null };

  return (
    <WorkspaceShell kind="member" nav="/businesses/contacted">
        <section className="band">
          <h1>Message sent</h1>
          <p className="lead">
            {business?.name ?? "The business"} will reply to you by email.
            ExpatPreneurs does not take part in the transaction.
          </p>
          <p>
            <Link className="btn" href="/businesses">
              Back to businesses
            </Link>{" "}
            {business ? (
              <Link className="btn primary" href={`/businesses/${business.slug}`}>
                Back to {business.name}
              </Link>
            ) : null}
          </p>
        </section>
      </WorkspaceShell>
  );
}