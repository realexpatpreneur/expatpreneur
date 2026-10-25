import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAccount, isPaid } from "@/lib/member";
import { stripeReady } from "@/lib/stripe";
import { money, rateOf, anyFounding, type Pricing } from "@/lib/pricing";
import {
  UpgradeButton,
  CancelMembershipButton,
  BillingPortalButton,
} from "./forms";

export const metadata = { title: "Village Membership, ExpatPreneurs Global" };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  // The one member page somebody reaches before their membership is
  // live, because this is where it becomes live.
  const member = await requireAccount("/upgrade");
  const supabase = await createClient();

  // The list on this page is her catalogue, held in plans, rather than
  // anything written here. One place to change it, and it is the same
  // list the public membership page shows.
  const { data: plan } = await supabase
    .from("plans")
    .select("blurb, features")
    .eq("slug", "paid")
    .maybeSingle();

  const { data: subscription } = isPaid(member)
    ? await supabase
        .from("subscriptions")
        .select("status, current_period_end, cancel_at")
        .eq("profile_id", member.id)
        .maybeSingle()
    : { data: null };

  // What this member's own Village charges, in its own currency, at its
  // founding rate while founding is open there.
  const { data: rate } = member.village_id
    ? await supabase
        .from("village_pricing")
        .select(
          "village_slug, village_name, currency, month_cents, year_cents, founding_month_cents, founding_year_cents, founding_open"
        )
        .eq("plan_slug", "paid")
        .eq("village_id", member.village_id)
        .maybeSingle()
    : { data: null };

  const priced = (rate ?? null) as Pricing | null;
  const monthCents = priced ? rateOf(priced, false) : null;
  const yearCents = priced ? rateOf(priced, true) : null;
  const monthly = monthCents ? money(monthCents, priced!.currency) : null;
  const yearly = yearCents ? money(yearCents, priced!.currency) : null;
  const founding = priced ? anyFounding([priced]) : false;

  const live = stripeReady && Boolean(monthly);

  return (
    <WorkspaceShell kind="member" nav="/upgrade">
        <section className="sec">
          <h1>Village Membership</h1>
          <p className="lead">
            {plan?.blurb ?? "Village Membership opens every Village."}
          </p>
          {state === "cancelled" ? (
            <div className="flag hold">Checkout was cancelled. Nothing was charged.</div>
          ) : null}
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              <div className="panel">
                <h3>What Village Membership includes</h3>
                <ul className="plain">
                  {((plan?.features ?? []) as string[]).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                {isPaid(member) ? (
                  <>
                    <h3>You are a Village Member</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {subscription?.cancel_at
                        ? "It ends at the end of the period you have paid for."
                        : subscription?.current_period_end
                          ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-GB")}.`
                          : member.complimentary
                            ? "Complimentary, given by an admin rather than paid for."
                            : "Set by an admin rather than a subscription."}
                    </p>
                    {live && subscription?.status === "active" ? (
                      <>
                        <BillingPortalButton />
                        <CancelMembershipButton />
                      </>
                    ) : null}
                  </>
                ) : live ? (
                  <>
                    <h3>
                      {monthly
                        ? `${monthly} a month in ${priced!.village_name}`
                        : "Open every Village"}
                    </h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {founding
                        ? "This is the founding rate, and it stays yours for as long as your membership runs without a break. "
                        : ""}
                      Cancel whenever you like. It runs to the end of the period
                      you have already paid for.
                    </p>
                    <UpgradeButton
                      label="Go to checkout"
                      monthly={monthly}
                      yearly={yearly}
                    />
                  </>
                ) : (
                  <>
                    <h3>Not switched on yet</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {stripeReady
                        ? "Your Village has no price set yet. Your Local Admin or the Global team sets it, and this opens the moment they do."
                        : "Village Membership opens shortly. Until then, ask your Local Admin if you need to reach another Village."}
                    </p>
                    <Link className="btn btn-ghost" href="/home">
                      Back to home
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}