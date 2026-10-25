import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
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
  const member = await requireMember("/upgrade");
  const supabase = await createClient();

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
            Explorer membership is free, and stays free. Village Membership is the rest of
            the network.
          </p>
          {state === "cancelled" ? (
            <div className="flag hold">Checkout was cancelled. Nothing was charged.</div>
          ) : null}
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              <div className="panel">
                <h3>What free membership gives you</h3>
                <ul className="plain">
                  <li>Your Village, your Circle and its WhatsApp group</li>
                  <li>Ask and Offer in your own Village</li>
                  <li>The Directory of your Village</li>
                  <li>Your Village's events and resources</li>
                  <li>Reading every Market Exploration post</li>
                  <li>The suggestion box</li>
                </ul>
              </div>

              <div className="panel">
                <h3>What Village Membership adds</h3>
                <ul className="plain">
                  <li>Replying to members in any Village</li>
                  <li>Asking to connect, and messaging once they accept</li>
                  <li>The Directory of every Village</li>
                  <li>Events in other Villages, as a visiting member</li>
                  <li>Resources from every Village</li>
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

              <div className="panel panel-wash">
                <h3>Why it is not everything</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Your own Village is the point, and it is free. Paying is for
                  people whose work crosses borders.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}