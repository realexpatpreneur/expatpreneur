import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { PlanForm } from "./forms";

export const metadata = { title: "Plans, the Global team" };

export default async function PlansPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, slug, name, blurb, price_cents, currency, interval, stripe_price_id, features, active")
    .order("position");

  const envPrice = process.env.STRIPE_MEMBERSHIP_PRICE_ID ?? null;
  const paid = plans?.find((p) => p.slug === "paid");
  const mismatch =
    envPrice && paid?.stripe_price_id && envPrice !== paid.stripe_price_id;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Plans</h1>
          <p className="lead">
            What membership costs and what each plan says it gives you. This
            is what the public membership page reads.
          </p>
          {mismatch ? (
            <div className="notice bad">
              The Stripe price id here does not match the one the platform is
              configured with. Members would be told one thing and charged
              another. Fix one of them.
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            {(plans ?? []).map((plan) => (
              <PlanForm key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <section className="band">
          <div className="panel wash">
            <h3>Changing a price</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Changing the number here changes what the site says, not what
              anybody is charged. A real price change means a new price in
              Stripe, its id pasted here and set as
              STRIPE_MEMBERSHIP_PRICE_ID, and members who already pay keep
              the price they joined on until they cancel.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}