import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import {
  AccountForm,
  ProfileSettingsForm,
  NotificationForm,
  PrivacyForm,
  MyDataButtons,
  UnblockButton,
  LeaveForm,
} from "./forms";
import { signOut } from "./actions";

export const metadata = { title: "Settings, ExpatPreneurs Global" };

const tabs = [
  ["account", "Account"],
  ["profile", "Profile"],
  ["membership", "Membership"],
  ["notifications", "Notifications"],
  ["privacy", "Privacy"],
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "account" } = await searchParams;
  const member = await requireMember("/settings");
  const supabase = await createClient();

  const [
    { data: profile },
    { data: prefs },
    { data: subscription },
    { data: village },
    { data: circle },
    { data: blocked },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("member_records")
      .select("*")
      .eq("id", member.id)
      .maybeSingle(),
    supabase
      .from("notification_prefs")
      .select("replies, messages, events, announcements, digest, newsletter")
      .eq("profile_id", member.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, provider_customer")
      .eq("profile_id", member.id)
      .maybeSingle(),
    member.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", member.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member.circle_id
      ? supabase
          .from("circles")
          .select("name")
          .eq("id", member.circle_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", member.id),
    supabase
      .from("plans")
      .select("slug, name, price_cents, currency, interval, features")
      .eq("active", true)
      .order("position"),
  ]);

  if (!profile) return null;

  const blockedIds = (blocked ?? []).map((b) => b.blocked_id);
  const { data: blockedPeople } = blockedIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", blockedIds)
    : { data: [] };

  const settings = prefs ?? {
    replies: true,
    messages: true,
    events: true,
    announcements: true,
    digest: true,
    newsletter: false,
  };

  const paidPlan = plans?.find((p) => p.slug === "paid");
  const money = (cents: number, currency: string) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

  const villageLine = `${village?.name ?? "No"} Village${
    circle?.name ? `, ${circle.name}` : ""
  }.`;

  return (
    <WorkspaceShell kind="member" nav="/settings">
        <section className="sec">
          <h1>Settings</h1>
          <div className="tabs">
            {tabs.map(([key, label]) => (
              <Link
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/settings?show=${key}`}
                key={key}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="stack" style={{ maxWidth: 760 }}>
            {show === "account" ? (
              <>
                <AccountForm
                  account={{
                    email: profile.email ?? "",
                    phone: profile.phone,
                    time_zone: profile.time_zone ?? "Gulf Standard Time (Dubai)",
                    language: profile.language ?? "English",
                  }}
                />
                <div className="panel">
                  <h3>Your Village</h3>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    {villageLine}
                  </p>
                  <Link className="btn btn-ghost" href="/settings/transfer">
                    Request a transfer to another Village
                  </Link>
                </div>
                <div className="panel">
                  <h3>Signing out</h3>
                  <form action={signOut} style={{ marginTop: 10 }}>
                    <button className="btn btn-ghost" type="submit">
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            ) : null}

            {show === "profile" ? <ProfileSettingsForm profile={profile} /> : null}

            {show === "membership" ? (
              <>
                <div className="panel">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <h3>{isPaid(member) ? "Paid member" : "Member"}</h3>
                      <p className="muted small">
                        {isPaid(member)
                          ? subscription?.current_period_end
                            ? `Renews on ${new Date(
                                subscription.current_period_end
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}`
                            : "Active"
                          : "Included with your invitation."}
                      </p>
                    </div>
                    {isPaid(member) ? (
                      <span className="chip chip-mint">Active</span>
                    ) : (
                      <Link className="btn btn-primary" href="/upgrade">
                        Upgrade to Paid member
                      </Link>
                    )}
                  </div>

                  {isPaid(member) ? (
                    <>
                      <dl className="kv">
                        <dt>Plan</dt>
                        <dd>
                          Paid member
                          {paidPlan && paidPlan.price_cents
                            ? `, ${money(paidPlan.price_cents, paidPlan.currency)} a ${paidPlan.interval}`
                            : ""}
                        </dd>
                        <dt>Payment method</dt>
                        <dd>Held by Stripe</dd>
                        <dt>Next payment</dt>
                        <dd>
                          {subscription?.current_period_end
                            ? new Date(
                                subscription.current_period_end
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Not known yet"}
                        </dd>
                      </dl>
                      <div className="row" style={{ marginTop: 14 }}>
                        <Link className="btn btn-ghost" href="/upgrade">
                          Update card
                        </Link>
                        <Link className="btn btn-ghost" href="/settings/receipts">
                          Receipts
                        </Link>
                        <Link className="btn btn-ghost" href="/upgrade">
                          Cancel paid membership
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <dl className="kv">
                        <dt>What you have</dt>
                        <dd>
                          Your Village and Circle, the Directory, Ask and Offer,
                          resources and local events
                        </dd>
                        <dt>Cost</dt>
                        <dd>Nothing. Membership comes with your invitation.</dd>
                        <dt>Paid plan</dt>
                        <dd>
                          {paidPlan && paidPlan.price_cents
                            ? `${money(paidPlan.price_cents, paidPlan.currency)} a ${paidPlan.interval}`
                            : "Price to be confirmed"}
                        </dd>
                        <dt>Payment method</dt>
                        <dd>None saved yet</dd>
                      </dl>
                      <div className="panel panel-wash" style={{ marginTop: 14 }}>
                        <p className="muted small" style={{ margin: 0 }}>
                          The paid plan adds every Village: contact members
                          anywhere, events in other Villages as a visiting
                          member, and the Directory of the whole network.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="panel">
                  <h3>Your Village</h3>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    {villageLine}
                  </p>
                  <Link className="btn btn-ghost" href="/settings/transfer">
                    Request a transfer to another Village
                  </Link>
                </div>
              </>
            ) : null}

            {show === "notifications" ? (
              <NotificationForm prefs={settings} />
            ) : null}

            {show === "privacy" ? (
              <>
                <PrivacyForm
                  privacy={{
                    public_profile: profile.public_profile,
                    show_business: profile.show_business ?? true,
                    findable_elsewhere: profile.findable_elsewhere ?? true,
                  }}
                />

                <div className="panel">
                  <h3>Your data</h3>
                  <div style={{ marginTop: 10 }}>
                    <MyDataButtons />
                  </div>
                </div>

                <div className="panel">
                  <h3>Blocked members</h3>
                  {(blockedPeople ?? []).length === 0 ? (
                    <p className="muted small">You have not blocked anyone.</p>
                  ) : (
                    <div className="stack" style={{ marginTop: 10 }}>
                      {(blockedPeople ?? []).map((person) => (
                        <UnblockButton
                          key={person.id}
                          id={person.id}
                          name={person.full_name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <h3>Leaving</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Your profile comes down and your Local Admin takes you out
                    of the WhatsApp groups.
                  </p>
                  <LeaveForm />
                </div>
              </>
            ) : null}
          </div>
        </section>
      </WorkspaceShell>
  );
}