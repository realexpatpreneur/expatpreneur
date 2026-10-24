# 114-three-of-ten-stripe.ps1
# Three of ten, as far as it goes without your keys. One migration:
# 0042_payment_intent.sql.
#
# Reading the payment code properly turned up a fault that would only
# have shown itself in a year. When a refund comes in, Stripe names the
# payment, not the row. We were storing only the checkout session, so
# finding the row meant asking Stripe about every paid row in turn until
# one matched. Fine with ten payments. With a thousand it is a thousand
# calls to Stripe inside a webhook that has to answer in seconds, and it
# would have started silently failing to process refunds.
#
# 0042 stores the payment identifier at the time of the sale, so a
# refund is one query. Anything paid for before this still works: it
# falls back to the old hunt, newest first and capped at fifty.
#
# The payouts form offered 70 percent because the number was typed into
# the form. The share is a setting the Global team can change, and the
# form now reads it.
#
# supabase/setup/stripe-setup.md is the rest: what to create in Stripe,
# which five events the webhook wants, the four settings for Vercel, the
# two numbers that live in the platform rather than in Stripe, and how
# to tell whether it worked. Use the test keys first.
#
# Worth saying plainly: none of this needs a domain. Stripe is happy
# with the vercel.app address, and so is Cloudflare Turnstile, which you
# can set up today with expatpreneur.vercel.app as the hostname and add
# the real domain later as a second one.
#
# Run the migration in Supabase:
#   supabase/migrations/0042_payment_intent.sql
#
#   powershell -ExecutionPolicy Bypass -File .\114-three-of-ten-stripe.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
-- Remembering which Stripe payment a row belongs to.
--
-- A refund arrives naming the payment intent. We were storing only the
-- checkout session, so finding the right row meant asking Stripe about
-- every paid row in turn until one matched. That is fine with ten
-- payments and unusable with a thousand.

alter table payments
  add column if not exists provider_intent text;

alter table course_purchases
  add column if not exists provider_intent text;

create index if not exists payments_intent_idx
  on payments(provider_intent) where provider_intent is not null;

create index if not exists course_purchases_intent_idx
  on course_purchases(provider_intent) where provider_intent is not null;
'@
Write-File "supabase\migrations\0042_payment_intent.sql" $f0

$f1 = @'
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeReady } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

// Stripe tells us what actually happened. Nothing in the browser is trusted
// to move someone onto the paid plan or to confirm a ticket.
export async function POST(request: Request) {
  if (!stripeReady) {
    return NextResponse.json({ error: "Payments are off" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const service = createAdminClient();

  if (event.type === "checkout.session.completed") {
    // Kept so a refund can find this row directly later.
    const sessionIntent = (() => {
      const o = event.data.object as Stripe.Checkout.Session;
      return typeof o.payment_intent === "string"
        ? o.payment_intent
        : o.payment_intent?.id ?? null;
    })();
    const session = event.data.object as Stripe.Checkout.Session;
    const profileId = session.metadata?.profile_id ?? session.client_reference_id;
    const kind = session.metadata?.kind ?? "membership";

    if (profileId && kind === "membership") {
      await service.from("payments").insert({
        profile_id: profileId,
        kind: "membership",
        amount_cents: session.amount_total ?? 0,
        currency: (session.currency ?? "eur").toUpperCase(),
        status: "paid",
        provider_ref: session.id,
        provider_intent: sessionIntent,
      });

      await service.from("subscriptions").upsert(
        {
          profile_id: profileId,
          plan: "paid",
          status: "active",
          provider: "stripe",
          provider_customer: String(session.customer ?? ""),
          provider_subscription: String(session.subscription ?? ""),
        },
        { onConflict: "profile_id" }
      );

      await service.from("profiles").update({ plan: "paid" }).eq("id", profileId);

      await notify(
        profileId,
        "membership",
        "Your paid membership is live",
        "Every Village is open to you now: their members, their events and their resources.",
        "/directory?village=all"
      );
    }

    // A course. The buyer may be a member or a stranger, so the purchase
    // carries whichever of the two we have.
    if (kind === "course") {
      const courseId = session.metadata?.course_id;

      if (courseId) {
        await service.from("course_purchases").insert({
          course_id: courseId,
          profile_id: profileId ?? null,
          guest_email: profileId ? null : session.customer_details?.email ?? null,
          guest_name: profileId ? null : session.customer_details?.name ?? null,
          amount_cents: session.amount_total ?? 0,
          currency: (session.currency ?? "eur").toUpperCase(),
          status: "paid",
          provider_ref: session.id,
          provider_intent: sessionIntent,
        });

        if (profileId) {
          // Paying is what opens the lessons, so the enrolment follows it.
          await service
            .from("enrolments")
            .upsert({ course_id: courseId, profile_id: profileId }, {
              onConflict: "course_id,profile_id",
            });

          const { data: course } = await service
            .from("courses")
            .select("title, slug, educator_id")
            .eq("id", courseId)
            .maybeSingle();

          await notify(
            profileId,
            "learning",
            `You bought ${course?.title ?? "a course"}`,
            "It is in your learning now.",
            `/learning/${course?.slug ?? ""}`
          );

          if (course?.educator_id) {
            await notify(
              course.educator_id,
              "learning",
              `Somebody bought ${course.title}`,
              "It is on your sales.",
              "/educator/sales"
            );
          }
        }
      }
    }

    if (profileId && kind === "event_ticket") {
      const eventId = session.metadata?.event_id;
      const needsApproval = session.metadata?.requires_approval === "1";

      await service.from("payments").insert({
        profile_id: profileId,
        kind: "event_ticket",
        event_id: eventId,
        amount_cents: session.amount_total ?? 0,
        currency: (session.currency ?? "aed").toUpperCase(),
        status: "paid",
        provider_ref: session.id,
        provider_intent: sessionIntent,
      });

      if (eventId) {
        await service
          .from("event_registrations")
          .update({ status: needsApproval ? "pending" : "confirmed" })
          .eq("event_id", eventId)
          .eq("profile_id", profileId);

        await notify(
          profileId,
          "event",
          needsApproval ? "Ticket paid, waiting for the host" : "Your place is confirmed",
          null,
          "/events?show=mine"
        );
      }
    }
  }

  // Money going back, whether we sent it or Stripe did.
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (intent) {
      // One query, because the intent is on the row.
      const { data: row } = await service
        .from("payments")
        .select("id")
        .eq("provider_intent", intent)
        .maybeSingle();

      if (row) {
        await service.from("payments").update({ status: "refunded" }).eq("id", row.id);
      } else {
        // Anything paid for before the intent was recorded. Ask Stripe
        // about those few, newest first, and stop at the match.
        const { data: older } = await service
          .from("payments")
          .select("id, provider_ref")
          .eq("status", "paid")
          .is("provider_intent", null)
          .order("created_at", { ascending: false })
          .limit(50);

        for (const old of older ?? []) {
          if (!old.provider_ref) continue;
          try {
            const found = await getStripe().checkout.sessions.retrieve(old.provider_ref);
            const its =
              typeof found.payment_intent === "string"
                ? found.payment_intent
                : found.payment_intent?.id;
            if (its === intent) {
              await service
                .from("payments")
                .update({ status: "refunded", provider_intent: intent })
                .eq("id", old.id);
              break;
            }
          } catch {
            // Nothing to do; the next one may match.
          }
        }
      }
    }
  }

  // A refunded course closes again, which is the whole point of recording
  // the purchase rather than the enrolment.
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (intent) {
      // Written down at the time of the sale, so this is one query.
      let { data: purchase } = await service
        .from("course_purchases")
        .select("id, course_id, profile_id")
        .eq("provider_intent", intent)
        .maybeSingle();

      if (!purchase) {
        // Bought before the intent was recorded. A short hunt, newest
        // first, rather than the whole table.
        const { data: older } = await service
          .from("course_purchases")
          .select("id, course_id, profile_id, provider_ref")
          .eq("status", "paid")
          .is("provider_intent", null)
          .order("created_at", { ascending: false })
          .limit(50);

        for (const old of older ?? []) {
          if (!old.provider_ref) continue;
          try {
            const found = await getStripe().checkout.sessions.retrieve(old.provider_ref);
            const its =
              typeof found.payment_intent === "string"
                ? found.payment_intent
                : found.payment_intent?.id;
            if (its === intent) {
              purchase = old;
              break;
            }
          } catch {
            // Try the next one.
          }
        }
      }

      if (purchase) {
        await service
          .from("course_purchases")
          .update({
            status: "refunded",
            refunded_at: new Date().toISOString(),
            provider_intent: intent,
          })
          .eq("id", purchase.id);

        // The course closes again, which is the point of recording the
        // purchase rather than the enrolment.
        if (purchase.profile_id) {
          await service
            .from("enrolments")
            .delete()
            .eq("course_id", purchase.course_id)
            .eq("profile_id", purchase.profile_id);
        }
      }
    }
  }

  // A card that stopped working. The member is told rather than quietly
  // dropped at the end of the period.
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customer =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (customer) {
      const { data: subscription } = await service
        .from("subscriptions")
        .select("profile_id")
        .eq("provider_customer", customer)
        .maybeSingle();

      if (subscription?.profile_id) {
        await notify(
          subscription.profile_id,
          "membership",
          "Your payment did not go through",
          "Stripe will try again. You can change the card from your settings.",
          "/upgrade"
        );
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const profileId = subscription.metadata?.profile_id;
    const ended =
      subscription.status !== "active" && subscription.status !== "trialing";

    if (profileId) {
      await service
        .from("subscriptions")
        .update({
          status: ended ? "cancelled" : "active",
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        })
        .eq("profile_id", profileId);

      // Losing the subscription drops them back to free membership, which
      // keeps their Village and their Circle.
      if (ended) {
        await service.from("profiles").update({ plan: "member" }).eq("id", profileId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
'@
Write-File "app\api\stripe\webhook\route.ts" $f1

$f2 = @'
"use client";

import { useActionState } from "react";
import { decideRefund, recordPayout, type PlanState } from "./actions";

export function RefundDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    decideRefund,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="request_id" value={id} />
      <label className="field">
        <span>A note</span>
        <input name="note" placeholder="Why, in a line" />
      </label>
      <div className="row">
        <button className="btn btn-primary" name="decision" value="approved" disabled={pending}>
          Refund it
        </button>
        <button className="btn btn-ghost" name="decision" value="refused" disabled={pending}>
          Refuse
        </button>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>
        Refunding asks Stripe first. If Stripe refuses, nothing is marked
        here, so the two cannot disagree.
      </p>
    </form>
  );
}

export function PayoutForm({
  educators,
  share = 70,
}: {
  educators: { id: string; name: string; owed: number; currency: string }[];
  share?: number;
}) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    recordPayout,
    {}
  );

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;

  return (
    <form action={action} className="panel">
      <h3>Record a payout</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <label className="field">
        <span>Educator</span>
        <select name="educator_id" defaultValue={educators[0]?.id}>
          {educators.map((educator) => (
            <option key={educator.id} value={educator.id}>
              {educator.name} ({(educator.owed / 100).toFixed(2)} {educator.currency})
            </option>
          ))}
        </select>
      </label>

      <div className="g2">
        <label className="field">
          <span>From</span>
          <input name="period_start" type="date" defaultValue={monthStart} />
        </label>
        <label className="field">
          <span>To</span>
          <input name="period_end" type="date" defaultValue={today} />
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>What the courses took</span>
          <input name="gross" type="number" min={0} step="0.01" />
        </label>
        <label className="field">
          <span>Their share, percent</span>
          <input name="share" type="number" min={0} max={100} defaultValue={share} />
          <span className="hint">
            From the educator share setting. Change it there, not here, if
            it is changing for everybody.
          </span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue="EUR">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue="paid">
            <option value="due">Owed</option>
            <option value="paid">Paid</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Reference</span>
        <input name="reference" placeholder="The bank reference you used" />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Record it"}
      </button>
    </form>
  );
}
'@
Write-File "app\global\plans\money-forms.tsx" $f2

$f3 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";
import { RefundDecision, PayoutForm } from "../plans/money-forms";

export default async function GlobalMoneyPage() {
  const supabase = await createClient();

  // What the educator keeps, as the Global team set it.
  const { data: shareSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "educator_share")
    .maybeSingle();
  const shareNow = Number(shareSetting?.value ?? 70);

  const [{ data: payments }, { data: subscriptions }, { count: paidMembers }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id, kind, amount_cents, currency, status, created_at, profile_id, guest_email")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("subscriptions")
        .select("id, status, current_period_end, profile_id")
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "paid"),
    ]);

  // The course side of the money: what sold, who wants a refund, and what
  // each educator is owed.
  const [{ data: sales }, { data: refundAsks }, { data: payouts }] =
    await Promise.all([
      supabase
        .from("course_sales")
        .select("purchase_id, course_title, educator_id, amount_cents, educator_cents, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("refund_requests")
        .select("id, purchase_id, profile_id, reason, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false }),
      supabase.from("payouts").select("person_id, net_cents, status, kind"),
    ]);

  const owedBy = new Map<string, { owed: number; currency: string }>();
  for (const sale of sales ?? []) {
    if (sale.status !== "paid" || !sale.educator_id) continue;
    const row = owedBy.get(sale.educator_id) ?? { owed: 0, currency: sale.currency };
    row.owed += sale.educator_cents ?? 0;
    owedBy.set(sale.educator_id, row);
  }
  for (const payout of payouts ?? []) {
    if (payout.status !== "paid") continue;
    const row = owedBy.get(payout.person_id);
    if (row) row.owed -= payout.net_cents;
  }

  const ids = [
    ...new Set([
      ...(payments ?? []).map((p) => p.profile_id).filter(Boolean),
      ...(sales ?? []).map((s) => s.educator_id).filter(Boolean),
      ...(refundAsks ?? []).map((r) => r.profile_id).filter(Boolean),
    ]),
  ] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const total = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Money</h1>
        <p className="lead">
          Memberships and event tickets. Rows appear here once Stripe is
          connected.
        </p>
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>Paid members</h3>
            <p className="lead" style={{ margin: 0 }}>{paidMembers ?? 0}</p>
          </div>
          <div className="panel">
            <h3>Active subscriptions</h3>
            <p className="lead" style={{ margin: 0 }}>
              {(subscriptions ?? []).length}
            </p>
          </div>
          <div className="panel">
            <h3>Taken so far</h3>
            <p className="lead" style={{ margin: 0 }}>
              {(total / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>Recent payments</h2>
        {(payments ?? []).length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet. Membership is free for now and tickets are not
              charged until Stripe is live.
            </p>
          </div>
        ) : (
          <div className="divide">
            {(payments ?? []).map((payment) => (
              <div className="li linkrow" key={payment.id}>
                <div>
                  <b>
                    {(payment.amount_cents / 100).toFixed(2)} {payment.currency}
                  </b>
                  <div className="muted small">
                    {payment.kind}.{" "}
                    {people?.find((p) => p.id === payment.profile_id)?.full_name ??
                      payment.guest_email ??
                      "A guest"}
                    . {timeAgo(payment.created_at)}.
                  </div>
                </div>
                <div className="rowmeta">
                  <span
                    className={`chip ${payment.status === "paid" ? "chip-mint" : ""}`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sec">
        <h2>Courses</h2>
        <div className="gside">
          <div className="stack">
            <div className="panel">
              <h3>Refunds asked for</h3>
              {(refundAsks ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing waiting.
                </p>
              ) : (
                <div className="stack" style={{ marginTop: 12 }}>
                  {(refundAsks ?? []).map((request) => (
                    <div className="panel panel-wash" key={request.id}>
                      <p className="muted small">
                        {people?.find((p) => p.id === request.profile_id)
                          ?.full_name ?? "A member"}
                        . {timeAgo(request.created_at)}
                      </p>
                      <p style={{ marginTop: 8 }}>{request.reason}</p>
                      <RefundDecision id={request.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <h3>Course sales</h3>
              {(sales ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing sold yet.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(sales ?? []).slice(0, 25).map((sale) => (
                    <div className="li linkrow" key={sale.purchase_id}>
                      <div>
                        <b>{sale.course_title}</b>
                        <div className="muted small">
                          {people?.find((p) => p.id === sale.educator_id)
                            ?.full_name ?? "An educator"}
                          . {timeAgo(sale.created_at)}
                        </div>
                      </div>
                      <div className="rowmeta">
                        <span className={`chip ${sale.status === "paid" ? "chip-mint" : ""}`}>
                          {(sale.amount_cents / 100).toFixed(0)} {sale.currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            {owedBy.size ? (
              <PayoutForm
                share={shareNow}
                educators={[...owedBy.entries()].map(([id, row]) => ({
                  id,
                  name: people?.find((p) => p.id === id)?.full_name ?? "An educator",
                  owed: row.owed,
                  currency: row.currency,
                }))}
              />
            ) : (
              <div className="panel panel-wash">
                <h3>Payouts</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing to pay out until a course sells.
                </p>
              </div>
            )}

            <div className="panel panel-wash">
              <h3>The share</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Educators keep a percentage of each sale, recorded on every
                payout, so changing it later does not change what was already
                agreed.
              </p>
              <Link className="btn btn-ghost" href="/global/plans">
                Plans and prices
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
'@
Write-File "app\global\money\page.tsx" $f3

$f4 = @'
# Switching payments on

Everything below is built. None of it runs until the four settings at
the bottom exist in Vercel.

## What to make in Stripe

**1. The membership price.** Products, add a product called Paid
member, recurring, monthly, at whatever you decide the price is. Copy
its price identifier, which starts with `price_`.

**2. The webhook.** Developers, Webhooks, add an endpoint pointing at:

    https://expatpreneur.vercel.app/api/stripe/webhook

Send it these five events and nothing else:

    checkout.session.completed
    charge.refunded
    invoice.payment_failed
    customer.subscription.updated
    customer.subscription.deleted

Copy the signing secret, which starts with `whsec_`.

**3. The card portal.** Settings, Billing, Customer portal, turn it on
and allow cancelling. That is what the Update card and Cancel buttons
in a member's settings open.

## The four settings, in Vercel

    STRIPE_SECRET_KEY            sk_live_... or sk_test_... to try it
    STRIPE_MEMBERSHIP_PRICE_ID   price_...
    STRIPE_WEBHOOK_SECRET        whsec_...
    NEXT_PUBLIC_SITE_URL         the address, once the domain exists

Use the test keys first. Stripe gives you a card number to pay with,
and nothing real moves.

## Two things to set inside the platform, not in Stripe

**The price members see.** Global team, Plans. The price on the
Membership page comes from there, not from Stripe, so the page can say
what it costs before Stripe is connected. Put the same number in both
or the page will disagree with the checkout.

**The educator share.** Global team, Plans, the educator share setting.
It is 70 percent until somebody decides otherwise. The payouts form
takes its default from that setting now.

## What starts working

Upgrading to the paid plan, and cancelling it. Paid event tickets, for
members and for guests. Buying a course at the member price or the
public one. Refunds, which close a course again and mark the payment.
Receipts. Educator earnings and payouts.

## How to know it worked

Upgrade yourself with a test card. Then check:

- Your settings say Paid member, with a renewal date.
- Global team, Payments, shows the payment.
- Stripe, Webhooks, shows a 200 against the event.

If the payment is in Stripe but not in the platform, it is the webhook:
wrong address, wrong secret, or the events not selected.
'@
Write-File "supabase\setup\stripe-setup.md" $f4

git add app supabase
git commit -m "A refund finds its payment in one query, and the Stripe setup written down"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0042_payment_intent.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
