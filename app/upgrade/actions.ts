"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteUrl, stripeReady } from "@/lib/stripe";
import { ticketPrice } from "@/lib/events";
import { roleCarriesMembership, STATUSES_IN_PLACE } from "@/lib/member";
import { rateOf, type Pricing } from "@/lib/pricing";

export type CheckoutState = { error?: string };

// Membership. One subscription, cancellable, and the webhook is what
// actually moves someone onto Village Membership.
export async function startMembershipCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  if (!stripeReady) {
    return { error: "Payments are not switched on yet." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/upgrade");

  const { data: profile } = await supabase
    .from("member_records")
    .select("full_name, email, plan, village_id, complimentary, status")
    .eq("id", user.id)
    .maybeSingle();

  // A complimentary member must never reach a checkout. Before this,
  // the guard only looked at the plan, so a Local Admin or a Pod Leader
  // could be taken to Stripe and charged for what they already have.
  // Marked left or removed. Only an admin can put that back, so taking
  // their money here would sell them access they would not get.
  if (profile && !STATUSES_IN_PLACE.includes(profile.status)) {
    return {
      error:
        "This account is not open. Your Local Admin can tell you where it stands.",
    };
  }

  if (
    profile?.plan === "paid" ||
    profile?.complimentary ||
    (await roleCarriesMembership(user.id))
  ) {
    return { error: "You are already a Village Member." };
  }
  if (!profile?.village_id) {
    return { error: "Your Village has to be set before you can take membership." };
  }

  // The price belongs to the Village, in the Village's own currency, at
  // its founding rate while founding is still open there.
  const yearly = String(formData.get("interval") ?? "month") === "year";

  const { data: rate } = await supabase
    .from("village_pricing")
    .select(
      "village_name, currency, month_cents, year_cents, founding_month_cents, founding_year_cents, founding_open"
    )
    .eq("plan_slug", "paid")
    .eq("village_id", profile.village_id)
    .maybeSingle();

  if (!rate) {
    return { error: "Your Village has no price set yet. Tell your Local Admin." };
  }

  const amount = rateOf(rate as unknown as Pricing, yearly);
  if (!amount) {
    return { error: "Your Village has no price set yet. Tell your Local Admin." };
  }

  // Whether this is a founding seat is decided here and recorded on the
  // payment, so the webhook can mark the badge without guessing later.
  const founding = Boolean(rate.founding_open);

  const stripe = getStripe();

  // Reuse the customer if this person has paid before.
  const service = createAdminClient();
  const { data: existing } = await service
    .from("subscriptions")
    .select("provider_customer")
    .eq("profile_id", user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(rate.currency).toLowerCase(),
          unit_amount: amount,
          recurring: { interval: yearly ? "year" : "month" },
          product_data: {
            name: `Village Membership, ${rate.village_name}`,
          },
        },
      },
    ],
    customer: existing?.provider_customer ?? undefined,
    customer_email: existing?.provider_customer ? undefined : profile?.email ?? user.email,
    client_reference_id: user.id,
    metadata: {
      profile_id: user.id,
      kind: "membership",
      founding: founding ? "yes" : "no",
      interval: yearly ? "year" : "month",
    },
    subscription_data: {
      metadata: { profile_id: user.id, founding: founding ? "yes" : "no" },
    },
    success_url: `${siteUrl}/upgrade/done?state=paid`,
    cancel_url: `${siteUrl}/upgrade?state=cancelled`,
  });

  if (!session.url) return { error: "Stripe did not return a checkout page." };

  redirect(session.url);
}

// Event tickets. The place is held as pending until the payment lands.
export async function startTicketCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  if (!stripeReady) return { error: "Payments are not switched on yet." };

  const eventId = String(formData.get("event_id"));
  const slug = String(formData.get("slug"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${slug}`);

  const { data: event } = await supabase
    .from("events")
    .select("id, title, price_cents, member_price_cents, currency, requires_approval")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return { error: "That event could not be found." };

  // What this buyer pays, which is the member price when they are on
  // Village Membership and the event carries one.
  const { data: buyer } = await supabase
    .from("profiles")
    .select("plan, complimentary")
    .eq("id", user.id)
    .maybeSingle();

  const amount = ticketPrice(
    event,
    buyer?.plan === "paid" ||
      Boolean(buyer?.complimentary) ||
      (await roleCarriesMembership(user.id))
  );
  if (!amount) return { error: "This event is free." };

  // A hold, so the seat is not sold twice while they are in Stripe.
  //
  // This used to be a plain insert, and the unique key meant the second
  // attempt collided and was reported as "You are already on the list for
  // this event." So abandoning a checkout once, by closing the tab or
  // letting it time out, left a pending row that blocked that person from
  // ever buying that ticket again. The row looks identical to a real
  // one, so nobody could see why.
  //
  // Somebody already confirmed is genuinely on the list and is told so.
  // Anybody else is retrying, and a retry gets their hold back.
  const { data: standing } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (standing?.status === "confirmed") {
    return { error: "You are already on the list for this event." };
  }

  // Not an upsert: the unique index here is partial, on profile_id is not
  // null, and Postgres cannot infer a partial index from an on conflict
  // clause. That is the same 42P10 that has kept the subscriptions table
  // empty since the day it was made, and it would have broken buying a
  // ticket altogether.
  const { error: holdError } = standing
    ? await supabase
        .from("event_registrations")
        .update({ status: "pending" })
        .eq("id", standing.id)
    : await supabase.from("event_registrations").insert({
        event_id: eventId,
        profile_id: user.id,
        status: "pending",
      });

  if (holdError) {
    return { error: "That place could not be held. Try again in a moment." };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: event.currency.toLowerCase(),
          unit_amount: amount,
          product_data: { name: event.title },
        },
      },
    ],
    client_reference_id: user.id,
    metadata: {
      profile_id: user.id,
      event_id: eventId,
      kind: "event_ticket",
      requires_approval: event.requires_approval ? "1" : "0",
    },
    success_url: `${siteUrl}/events/${slug}?ticket=paid`,
    cancel_url: `${siteUrl}/events/${slug}?ticket=cancelled`,
  });

  if (!session.url) return { error: "Stripe did not return a checkout page." };

  redirect(session.url);
}

export async function cancelMembership(
  _prev: CheckoutState,
  _formData: FormData
): Promise<CheckoutState> {
  if (!stripeReady) return { error: "Payments are not switched on yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/upgrade");

  const service = createAdminClient();
  const { data: subscription } = await service
    .from("subscriptions")
    .select("provider_subscription")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription?.provider_subscription) {
    return { error: "There is no active subscription on this account." };
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(subscription.provider_subscription, {
    cancel_at_period_end: true,
  });

  redirect("/upgrade/done?state=cancelled");
}

// Stripe keeps the card, so changing it, seeing invoices and cancelling all
// happen on their portal rather than here.
export async function openBillingPortal(
  _prev: CheckoutState,
  _formData: FormData
): Promise<CheckoutState> {
  if (!stripeReady) return { error: "Payments are not switched on yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/upgrade");

  const service = createAdminClient();
  const { data: subscription } = await service
    .from("subscriptions")
    .select("provider_customer")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!subscription?.provider_customer) {
    return { error: "There is nothing to manage on this account yet." };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer,
    return_url: `${siteUrl}/upgrade`,
  });

  redirect(session.url);
}

// Giving the money back for an event that did not happen. Called when a
// host calls an event off, so nobody has to remember.
export async function refundTicketsFor(eventId: string) {
  if (!stripeReady) return;

  const service = createAdminClient();
  const { data: payments } = await service
    .from("payments")
    .select("id, provider_ref, status")
    .eq("event_id", eventId)
    .eq("status", "paid");

  if (!payments?.length) return;

  const stripe = getStripe();

  for (const payment of payments) {
    if (!payment.provider_ref) continue;
    try {
      // The reference we keep is the checkout session, which knows its
      // own payment.
      const session = await stripe.checkout.sessions.retrieve(payment.provider_ref);
      const intent = session.payment_intent;
      if (!intent) continue;

      await stripe.refunds.create({
        payment_intent: typeof intent === "string" ? intent : intent.id,
      });

      await service
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", payment.id);
    } catch {
      // A refund that will not go through is left for a person to sort
      // out, rather than silently marked as done.
    }
  }
}