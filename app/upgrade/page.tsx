import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { stripeReady, membershipPriceId } from "@/lib/stripe";
import {
  UpgradeButton,
  CancelMembershipButton,
  BillingPortalButton,
} from "./forms";

export const metadata = { title: "The paid plan, ExpatPreneurs Global" };

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

  const live = stripeReady && Boolean(membershipPriceId);

  return (
    <WorkspaceShell kind="member" nav="/upgrade">
        <section className="band">
          <h1>The paid plan</h1>
          <p className="lead">
            Membership is free, and stays free. The paid plan is the rest of
            the network.
          </p>
          {state === "cancelled" ? (
            <div className="notice bad">Checkout was cancelled. Nothing was charged.</div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
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
                <h3>What the paid plan adds</h3>
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
                    <h3>You are on the paid plan</h3>
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
                    <h3>Open every Village</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Cancel whenever you like. It runs to the end of the period
                      you have already paid for.
                    </p>
                    <UpgradeButton label="Go to checkout" />
                  </>
                ) : (
                  <>
                    <h3>Not switched on yet</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      The paid plan opens shortly. Until then, ask your Local
                      Admin if you need to reach another Village.
                    </p>
                    <Link className="btn" href="/home">
                      Back to home
                    </Link>
                  </>
                )}
              </div>

              <div className="panel wash">
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