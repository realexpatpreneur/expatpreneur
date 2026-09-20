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
      const { data: sessions } = await service
        .from("payments")
        .select("id, provider_ref")
        .eq("status", "paid");

      // The reference we keep is the checkout session, so match on the
      // intent recorded against it.
      for (const row of sessions ?? []) {
        if (!row.provider_ref) continue;
        try {
          const found = await getStripe().checkout.sessions.retrieve(row.provider_ref);
          const its =
            typeof found.payment_intent === "string"
              ? found.payment_intent
              : found.payment_intent?.id;
          if (its === intent) {
            await service
              .from("payments")
              .update({ status: "refunded" })
              .eq("id", row.id);
            break;
          }
        } catch {
          // Nothing to do; the next one may match.
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
      const { data: purchases } = await service
        .from("course_purchases")
        .select("id, course_id, profile_id, provider_ref")
        .eq("status", "paid");

      for (const purchase of purchases ?? []) {
        if (!purchase.provider_ref) continue;
        try {
          const found = await getStripe().checkout.sessions.retrieve(purchase.provider_ref);
          const its =
            typeof found.payment_intent === "string"
              ? found.payment_intent
              : found.payment_intent?.id;
          if (its !== intent) continue;

          await service
            .from("course_purchases")
            .update({ status: "refunded", refunded_at: new Date().toISOString() })
            .eq("id", purchase.id);

          if (purchase.profile_id) {
            await service
              .from("enrolments")
              .delete()
              .eq("course_id", purchase.course_id)
              .eq("profile_id", purchase.profile_id);
          }
          break;
        } catch {
          // Try the next one.
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