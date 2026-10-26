import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { PlanForm } from "./forms";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Plans, the Global team" };

export default async function PlansPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, slug, name, blurb, price_cents, currency, interval, stripe_price_id, features, active")
    .order("position");

  return (
    <main className="wrap">
        <section className="sec">
          <Crumbs trail={[["The Global team", "/global"], ["Plans"]]} />
          <h1>Plans and benefits</h1>
          <p className="lead">
            What membership costs and what each plan says it gives you. This
            is what the public membership page reads.
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            {(plans ?? []).map((plan) => (
              <PlanForm key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="panel panel-wash">
            <h3>Changing a price</h3>
            <p className="muted small" style={{ marginTop: 8 }}>
              Changing the number here changes what the Membership page says
              and what Stripe charges, because the price is built from the
              member's own Village at the moment they pay. There is nothing
              to make in Stripe. Members who already pay keep the price they
              joined on until they cancel.
            </p>
          </div>
        </section>
    </main>
  );
}