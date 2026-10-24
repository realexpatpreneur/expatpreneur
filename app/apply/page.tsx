import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { ApplyForm } from "./form";
import { WhyJoin, WhatHappensNext } from "@/components/why-join";

export const metadata = { title: "Request an invitation, ExpatPreneurs Global" };

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching"])
    .order("name");

  // The panel beside the form names every Village, including the ones
  // being explored, because somebody reading this may be in one of them.
  const { data: allVillages } = await supabase
    .from("villages")
    .select("name, status")
    .in("status", ["open", "launching", "exploring"])
    .order("name");

  return (
    <PublicPage>
      <PageBlocks slug="apply">
      <main className="wrap">
        <section className="sec">
          <h1>Request an invitation</h1>
          <p className="lead">
            Every request is read personally. Tell us about you, your business
            and where your journey has taken you.
          </p>
          <p className="muted small">
            Already asked? <Link href="/apply/status">Check where it stands</Link>.
          </p>
        </section>
        <section className="sec">
          <div className="gside">
            <div>
              <WhyJoin villages={allVillages ?? []} />
              <div style={{ marginTop: 18 }}>
                <ApplyForm villages={villages ?? []} />
              </div>
            </div>
            <WhatHappensNext />
          </div>
        </section>
      </main>
          </PageBlocks>
</PublicPage>
  );
}