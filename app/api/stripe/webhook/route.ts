import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeReady } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

// Stripe tells us what actually happened. Nothing in the browser is trusted
// to move someone onto Village Membership or to confirm a ticket.
//
// Everything in here used to answer Stripe with a 200 whatever happened
// underneath. Twenty five database calls, three mentions of the word
// error, and not one of them checked. Stripe treats a 200 as delivered
// and never sends that event again, so a failed write here was permanent
// and unrecorded: somebody could pay and simply not become a member, with
// nothing anywhere saying so.
//
// So every write is checked now, and a failure throws. The handler
// answers 500, Stripe retries with its own backoff, and the retry is safe
// because 0077 made the writes idempotent: a second delivery collides on
// the provider reference instead of recording the payment twice.

class WebhookFailure extends Error {
  constructor(
    readonly step: string,
    readonly detail: string
  ) {
    super(`${step}: ${detail}`);
  }
}

type Result<T> = { data: T; error: { message: string; code?: string } | null };

// A write that has to have happened. Anything else and Stripe should try
// again rather than be told all is well.
function must<T>(step: string, result: Result<T>): T {
  if (result.error) throw new WebhookFailure(step, result.error.message);
  return result.data;
}

// A write that must happen once. A unique violation means this event has
// already been handled, which is the normal shape of a redelivery.
async function once(
  step: string,
  write: PromiseLike<{ error: { message: string; code?: string } | null }>
): Promise<boolean> {
  const { error } = await write;
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new WebhookFailure(step, error.message);
}

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

  try {
    await handle(event);
  } catch (failure) {
    // Stripe retries a 500 for about three days. That is the only thing
    // standing between a transient database error and a member who paid
    // and never became one.
    const step =
      failure instanceof WebhookFailure ? failure.step : "unknown step";
    const detail =
      failure instanceof Error ? failure.message : String(failure);
    console.error(`[stripe] ${event.type} failed at ${step}: ${detail}`);
    return NextResponse.json(
      { error: "Not finished. Please retry.", step },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handle(event: Stripe.Event) {
  const service = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    // An empty string is not an id. The checkout sends `user?.id ?? ""`
    // for a guest, and `??` does not fall through an empty string, so
    // without this the guest branch passed "" into a uuid column.
    const profileId =
      session.metadata?.profile_id || session.client_reference_id || null;
    const kind = session.metadata?.kind ?? "membership";

    if (profileId && kind === "membership") {
      const fresh = await once(
        "membership payment",
        service.from("payments").insert({
          profile_id: profileId,
          kind: "membership",
          amount_cents: session.amount_total ?? 0,
          currency: (session.currency ?? "eur").toUpperCase(),
          status: "paid",
          provider_ref: session.id,
          provider_intent: sessionIntent,
        })
      );

      // Already handled. Everything below it is the same work again, and
      // the notifications would go out twice.
      if (!fresh) return;

      must(
        "membership subscription",
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
        )
      );

      // A founding seat is claimed by paying, which is what the seat
      // count in village_pricing counts. The rate itself is held by the
      // Stripe subscription, so it survives as long as that does.
      const tookFounding = session.metadata?.founding === "yes";

      // This is the moment membership begins. Somebody who was invited
      // becomes a member, and the Circle their Local Admin chose while
      // approving them is given now rather than on approval.
      const joining = must(
        "reading the joiner",
        await service
          .from("profiles")
          .select("status, circle_id, village_id")
          .eq("id", profileId)
          .maybeSingle()
      );

      const wasInvited = joining?.status === "invited";

      // maybeSingle errors when somebody has two application rows, which
      // nothing prevents, and that used to silently cost them their
      // Circle. Take the newest instead.
      const applications = wasInvited
        ? must(
            "reading the application",
            await service
              .from("applications")
              .select("circle_id, created_at")
              .eq("profile_id", profileId)
              .order("created_at", { ascending: false })
              .limit(1)
          )
        : [];

      const application = applications?.[0] ?? null;

      const becoming: Record<string, unknown> = { plan: "paid" };
      if (tookFounding) becoming.founding = true;
      if (wasInvited) becoming.status = "active";

      // The Circle their admin chose while approving them, if it still
      // has room. 0080 enforces the fifty, including against this
      // connection, because the cap is a rule of the product rather than
      // a permission. So ask first: a payment must never fail because a
      // Circle filled up while somebody was in Stripe. They arrive
      // unplaced instead, and the Local Admin places them, which is the
      // same thing that happens when no Circle was chosen at all.
      if (wasInvited && application?.circle_id && !joining?.circle_id) {
        const room = must(
          "checking the circle has room",
          await service
            .from("circle_capacity")
            .select("places_left")
            .eq("circle_id", application.circle_id)
            .maybeSingle()
        );

        if ((room?.places_left ?? 0) > 0) {
          becoming.circle_id = application.circle_id;
        }
      }

      must(
        "making them a member",
        await service.from("profiles").update(becoming).eq("id", profileId)
      );

      // And the group task, which waited for the same moment.
      if (becoming.circle_id) {
        const circle = must(
          "reading the circle",
          await service
            .from("circles")
            .select("name")
            .eq("id", becoming.circle_id as string)
            .maybeSingle()
        );
        must(
          "raising the whatsapp task",
          await service.from("whatsapp_tasks").insert({
            village_id: joining?.village_id ?? null,
            profile_id: profileId,
            kind: "add",
            group_name: circle?.name ?? "Village group",
          })
        );
      }

      await notify(
        profileId,
        "membership",
        "Your Village Membership is live",
        "Every Village is open to you now: their members, their events and their resources.",
        "/directory?village=all"
      );

      // Somebody has actually joined, which is the Local Admin's cue:
      // the WhatsApp group, the welcome, the introduction.
      if (wasInvited && joining?.village_id) {
        const locals = must(
          "reading the local admins",
          await service
            .from("member_roles")
            .select("profile_id")
            .eq("role", "local_admin")
            .eq("scope_id", joining.village_id)
            .is("ended_at", null)
        );

        const joiner = must(
          "reading the joiner's name",
          await service
            .from("profiles")
            .select("full_name")
            .eq("id", profileId)
            .maybeSingle()
        );

        for (const local of locals ?? []) {
          await notify(
            local.profile_id,
            "announcement",
            `${joiner?.full_name ?? "A new member"} has joined`,
            "They have paid, so their membership is live. The WhatsApp group is the part only you can do.",
            `/admin/members/${profileId}`
          );
        }
      }
    }

    // A course. The buyer may be a member or a stranger, so the purchase
    // carries whichever of the two we have.
    if (kind === "course") {
      const courseId = session.metadata?.course_id;

      if (courseId) {
        const fresh = await once(
          "course purchase",
          service.from("course_purchases").insert({
            course_id: courseId,
            profile_id: profileId,
            guest_email: profileId ? null : session.customer_details?.email ?? null,
            guest_name: profileId ? null : session.customer_details?.name ?? null,
            amount_cents: session.amount_total ?? 0,
            currency: (session.currency ?? "eur").toUpperCase(),
            status: "paid",
            provider_ref: session.id,
            provider_intent: sessionIntent,
          })
        );

        if (fresh && profileId) {
          // Paying is what opens the lessons, so the enrolment follows it.
          must(
            "enrolling the buyer",
            await service.from("enrolments").upsert(
              { course_id: courseId, profile_id: profileId },
              { onConflict: "course_id,profile_id" }
            )
          );

          const course = must(
            "reading the course",
            await service
              .from("courses")
              .select("title, slug, educator_id")
              .eq("id", courseId)
              .maybeSingle()
          );

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

      const fresh = await once(
        "ticket payment",
        service.from("payments").insert({
          profile_id: profileId,
          kind: "event_ticket",
          event_id: eventId,
          amount_cents: session.amount_total ?? 0,
          currency: (session.currency ?? "aed").toUpperCase(),
          status: "paid",
          provider_ref: session.id,
          provider_intent: sessionIntent,
        })
      );

      if (fresh && eventId) {
        must(
          "confirming the registration",
          await service
            .from("event_registrations")
            .update({ status: needsApproval ? "pending" : "confirmed" })
            .eq("event_id", eventId)
            .eq("profile_id", profileId)
        );

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

  // Every month after the first. Nothing handled these, so a member who
  // paid monthly for a year had one payment row for the whole year, and
  // the Global team's revenue figure counted one month of it.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const customer =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (customer) {
      const subscription = must(
        "finding the subscriber",
        await service
          .from("subscriptions")
          .select("profile_id")
          .eq("provider_customer", customer)
          .maybeSingle()
      );

      if (subscription?.profile_id) {
        const fresh = await once(
          "recurring payment",
          service.from("payments").insert({
            profile_id: subscription.profile_id,
            kind: "membership",
            amount_cents: invoice.amount_paid ?? 0,
            currency: (invoice.currency ?? "eur").toUpperCase(),
            status: "paid",
            provider: "stripe",
            provider_ref: invoice.id,
          })
        );

        if (fresh) {
          // A renewal that succeeds after a failure puts them back. Before
          // this there was no branch anywhere that set plan back to paid,
          // so one failed card cost a member their access permanently
          // while Stripe carried on charging them.
          must(
            "restoring the membership",
            await service
              .from("profiles")
              .update({ plan: "paid" })
              .eq("id", subscription.profile_id)
          );

          must(
            "marking the subscription live",
            await service
              .from("subscriptions")
              .update({ status: "active" })
              .eq("profile_id", subscription.profile_id)
          );
        }
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

    // A partial refund is not a cancellation. Refunding ten euros of a
    // forty nine euro course used to revoke the whole thing.
    const inFull = charge.amount_refunded >= charge.amount;

    if (intent) {
      // ---- the membership or ticket side ----
      const row = must(
        "finding the payment",
        await service
          .from("payments")
          .select("id, kind, profile_id")
          .eq("provider_intent", intent)
          .maybeSingle()
      );

      let payment = row;

      if (!payment) {
        // Anything paid for before the intent was recorded. Ask Stripe
        // about those few, newest first, and stop at the match.
        const older = must(
          "hunting for the payment",
          await service
            .from("payments")
            .select("id, kind, profile_id, provider_ref")
            .eq("status", "paid")
            .is("provider_intent", null)
            .order("created_at", { ascending: false })
            .limit(50)
        );

        for (const old of older ?? []) {
          if (!old.provider_ref) continue;
          try {
            const found = await getStripe().checkout.sessions.retrieve(old.provider_ref);
            const its =
              typeof found.payment_intent === "string"
                ? found.payment_intent
                : found.payment_intent?.id;
            if (its === intent) {
              payment = old;
              break;
            }
          } catch {
            // Nothing to do; the next one may match.
          }
        }
      }

      if (payment && inFull) {
        must(
          "marking the payment refunded",
          await service
            .from("payments")
            .update({ status: "refunded", provider_intent: intent })
            .eq("id", payment.id)
        );

        // A refunded membership used to keep full access until somebody
        // cancelled the Stripe subscription by hand. The course branch
        // below always closed; this one never did.
        if (payment.kind === "membership" && payment.profile_id) {
          must(
            "closing the membership",
            await service
              .from("profiles")
              .update({ plan: "member", founding: false })
              .eq("id", payment.profile_id)
          );

          must(
            "marking the subscription cancelled",
            await service
              .from("subscriptions")
              .update({ status: "cancelled" })
              .eq("profile_id", payment.profile_id)
          );

          await notify(
            payment.profile_id,
            "membership",
            "Your membership has been refunded",
            "Your Village stays yours. The rest of the network closes again.",
            "/upgrade"
          );
        }
      }

      // ---- the course side ----
      let purchase = must(
        "finding the purchase",
        await service
          .from("course_purchases")
          .select("id, course_id, profile_id")
          .eq("provider_intent", intent)
          .maybeSingle()
      );

      if (!purchase) {
        const older = must(
          "hunting for the purchase",
          await service
            .from("course_purchases")
            .select("id, course_id, profile_id, provider_ref")
            .eq("status", "paid")
            .is("provider_intent", null)
            .order("created_at", { ascending: false })
            .limit(50)
        );

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

      if (purchase && inFull) {
        must(
          "marking the purchase refunded",
          await service
            .from("course_purchases")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
              provider_intent: intent,
            })
            .eq("id", purchase.id)
        );

        // The course closes again, which is the point of recording the
        // purchase rather than the enrolment.
        if (purchase.profile_id) {
          must(
            "closing the course",
            await service
              .from("enrolments")
              .delete()
              .eq("course_id", purchase.course_id)
              .eq("profile_id", purchase.profile_id)
          );
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
      const subscription = must(
        "finding the subscriber",
        await service
          .from("subscriptions")
          .select("profile_id")
          .eq("provider_customer", customer)
          .maybeSingle()
      );

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

    // past_due is Stripe still trying, not Stripe giving up. Treating it
    // as ended dropped a member to free membership the moment their first
    // renewal attempt failed, and nothing ever put them back, so they
    // kept paying and kept the door shut. Only these three are over.
    const ended =
      event.type === "customer.subscription.deleted" ||
      ["canceled", "unpaid", "incomplete_expired"].includes(subscription.status);

    const live = ["active", "trialing"].includes(subscription.status);

    if (profileId) {
      const periodEnd =
        (subscription as unknown as { current_period_end?: number })
          .current_period_end ?? null;

      must(
        "updating the subscription",
        await service
          .from("subscriptions")
          .update({
            status: ended ? "cancelled" : live ? "active" : "past_due",
            // Read in three places and written in none, so the renewal
            // date has never once appeared.
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
          })
          .eq("profile_id", profileId)
      );

      // Losing the subscription closes the member side and keeps their
      // Village. The Circle place is theirs for another 35 days, after
      // which the nightly job in 0083 releases it and remembers which
      // Circle it was, so coming back inside that window puts them
      // straight back into it. Nothing here has to write lapsed_at: the
      // trigger in 0083 stamps it off the state of the row, which is how
      // a refund, a Local Admin turning complimentary off and a role
      // being given back are all covered by the same rule.
      //
      // The founding flag goes with it: leaving it set let the fifty seat
      // cap drift upward, because the seat count reads that column and a
      // returning member kept a seat they had already given back.
      if (ended) {
        must(
          "ending the membership",
          await service
            .from("profiles")
            .update({ plan: "member", founding: false })
            .eq("id", profileId)
        );
      }

      // And back again, for a subscription that recovers.
      if (live) {
        must(
          "restoring the membership",
          await service.from("profiles").update({ plan: "paid" }).eq("id", profileId)
        );
      }
    }
  }
}
