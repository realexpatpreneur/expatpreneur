import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ApplyForm } from "./form";

export const metadata = { title: "Request an invitation, ExpatPreneurs Global" };

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching"])
    .order("name");

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Request an invitation</h1>
          <p className="lead">
            Every request is read personally. Tell us about you, your business
            and where your journey has taken you.
          </p>
          <p className="muted small">
            Already asked? <Link href="/apply/status">Check where it stands</Link>.
          </p>
        </section>
        <section className="band">
          <ApplyForm villages={villages ?? []} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}