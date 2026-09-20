"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, membershipPriceId, siteUrl, stripeReady } from "@/lib/stripe";

export type CheckoutState = { error?: string };

// Membership. One subscription, cancellable, and the webhook is what
// actually moves someone onto the paid plan.
export async function startMembershipCheckout(
  _prev: CheckoutState,
  _formData: FormData
): Promise<CheckoutState> {
  if (!stripeReady || !membershipPriceId) {
    return { error: "Payments are not switched on yet." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/upgrade");

  const { data: profile } = await supabase
    .from("member_records")
    .select("full_name, email, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan === "paid") return { error: "You are already on the paid plan." };

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
    line_items: [{ price: membershipPriceId, quantity: 1 }],
    customer: existing?.provider_customer ?? undefined,
    customer_email: existing?.provider_customer ? undefined : profile?.email ?? user.email,
    client_reference_id: user.id,
    metadata: { profile_id: user.id, kind: "membership" },
    subscription_data: { metadata: { profile_id: user.id } },
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
    .select("id, title, price_cents, currency, requires_approval")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return { error: "That event could not be found." };
  if (!event.price_cents) return { error: "This event is free." };

  const { error: holdError } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
    status: "pending",
  });

  if (holdError) {
    return { error: "You are already on the list for this event." };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: event.currency.toLowerCase(),
          unit_amount: event.price_cents,
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