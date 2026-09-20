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