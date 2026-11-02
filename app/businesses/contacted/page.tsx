import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { PHOTO } from "@/components/design/parts";

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

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    return (
      <PublicPage active="/businesses">
        <div className="d-page">
          <section style={{ padding: "80px 0 112px" }}>
            <div className="d-wrap d-split">
              <div>
                <h1 className="d-h1" style={{ maxWidth: "14ch" }}>Message sent</h1>
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                  {business?.name ?? "The business"} will reply to you by email.
                  ExpatPreneurs does not take part in the transaction.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                  <Link className="d-btn d-btn-line d-shine" href="/businesses">
                    Back to businesses
                  </Link>
                  {business ? (
                    <Link className="d-btn d-btn-dark d-shine" href={`/businesses/${business.slug}`}>
                      Back to {business.name}
                    </Link>
                  ) : null}
                </div>
              </div>
              <span className="d-shine" style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PHOTO.members} alt="" style={{ width: "100%", height: 420, objectFit: "cover" }} />
              </span>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/businesses" active="/businesses">
        <section className="sec">
          <h1>Message sent</h1>
          <p className="lead">
            {business?.name ?? "The business"} will reply to you by email.
            ExpatPreneurs does not take part in the transaction.
          </p>
          <p>
            <Link className="btn btn-ghost" href="/businesses">
              Back to businesses
            </Link>{" "}
            {business ? (
              <Link className="btn btn-primary" href={`/businesses/${business.slug}`}>
                Back to {business.name}
              </Link>
            ) : null}
          </p>
        </section>
      </DualPage>
  );
}