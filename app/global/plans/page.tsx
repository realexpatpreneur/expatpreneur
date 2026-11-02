import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { PlanForm, VillageRateForm } from "./forms";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Plans, the Global team" };

export default async function PlansPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: plans }, { data: rates }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, slug, name, blurb, price_cents, currency, interval, features, active")
      .order("position"),
    // What members are actually charged. Per Village, in the Village's own
    // currency, which is what /membership prints and what /upgrade builds
    // the checkout from.
    supabase
      .from("village_pricing")
      .select(
        "village_id, village_name, currency, month_cents, year_cents, founding_month_cents, founding_year_cents, founding_seats, founding_taken, founding_open"
      )
      .eq("plan_slug", "paid")
      .order("village_name"),
  ]);

  // village_pricing does not carry founding_days, and the form needs it.
  const { data: days } = await supabase
    .from("village_plans")
    .select("village_id, founding_days");

  const paidPlanId = (plans ?? []).find((p) => p.slug === "paid")?.id ?? "";

  return (
    <main className="wrap">
        <section className="sec">
          <Crumbs trail={[["The Global team", "/global"], ["Plans"]]} />
          <h1>Plans and benefits</h1>
          <p className="lead">
            What each plan is called and what it says it gives you, and below
            it the rates each Village charges.
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
          <h2>What each Village charges</h2>
          <p className="lead">
            The rate is per Village, in its own currency, and the Global team
            is the only one who can change it. Payment itself is collected
            centrally; no Village or Circle takes money.
          </p>
          <div className="gside" style={{ marginTop: 16 }}>
            {(rates ?? []).map((rate) => (
              <VillageRateForm
                key={rate.village_id}
                planId={paidPlanId}
                rate={{
                  ...rate,
                  founding_days:
                    (days ?? []).find((d) => d.village_id === rate.village_id)
                      ?.founding_days ?? 90,
                }}
              />
            ))}
          </div>
          {(rates ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted small" style={{ margin: 0 }}>
                No Village has a rate yet, so the membership page has nothing
                to show and the checkout cannot open.
              </p>
            </div>
          ) : null}
        </section>

        <section className="sec">
          <div className="panel panel-wash">
            <h3>Changing a rate</h3>
            <p className="muted small" style={{ marginTop: 8 }}>
              The checkout builds its charge from these figures at the moment
              somebody pays, so there is nothing to make in Stripe. Members
              who already pay keep the rate they joined on until they cancel.
            </p>
          </div>
        </section>
    </main>
  );
}