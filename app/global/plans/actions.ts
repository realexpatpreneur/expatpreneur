"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";

export type PlanState = { error?: string; done?: string };

// What a plan is called and what it says it gives you. Not what it costs:
// the rate is per Village and lives in village_plans, which saveVillageRate
// below writes and which the membership page and the checkout both read.
//
// This used to write stripe_price_id as well, which nothing anywhere
// reads, under a hint warning that if it and the price disagreed Stripe
// would win. The checkout builds its charge inline from the Village
// rate, so it could not. price_cents and currency do get printed, by
// components/blocks.tsx, for a plan with no per-Village rate, so they
// stay. The page claimed "Changing the number here changes what the
// Membership page says and what Stripe charges", and for the paid plan
// it changed neither.
export async function savePlan(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const features = String(formData.get("features") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("plans")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      blurb: String(formData.get("blurb") ?? "").trim() || null,
      price_cents: Math.round(Number(formData.get("price") ?? 0) * 100),
      currency: String(formData.get("currency") ?? "EUR"),
      interval: String(formData.get("interval") ?? "month"),
      features,
      active: Boolean(formData.get("active")),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await record(admin.userId, "plan.changed", "plan", id, {
    name: String(formData.get("name") ?? "").trim(),
  });

  revalidatePath("/global/plans");
  revalidatePath("/membership");
  return { done: "saved" };
}

// Refunds and payouts. The money went through the platform, so the Global
// team settles both, and the educator sees what was decided.
export async function decideRefund(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  const admin = await requireGlobal();
  const supabase = await createClient();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const service = createAdminClient();

  const id = String(formData.get("request_id"));
  const decision = String(formData.get("decision"));

  const { data: request } = await supabase
    .from("refund_requests")
    .select("id, purchase_id, profile_id")
    .eq("id", id)
    .maybeSingle();

  if (!request) return { error: "That request is not there any more." };

  if (decision === "approved") {
    const { data: purchase } = await service
      .from("course_purchases")
      .select("id, provider_ref, course_id, profile_id")
      .eq("id", request.purchase_id)
      .maybeSingle();

    // Without a reference there is nothing to refund against, and the
    // whole Stripe block used to be skipped silently: the request was
    // still marked approved, the audit log still said refund.approved,
    // and the learner was still told their money was on its way. It never
    // moved. Say so instead.
    if (!purchase?.provider_ref) {
      return {
        error:
          "There is no Stripe reference on that purchase, so nothing can be " +
          "refunded from here. Refund it in Stripe, then mark this approved.",
      };
    }

    {
      try {
        const { getStripe } = await import("@/lib/stripe");
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(purchase.provider_ref);
        const intent = session.payment_intent;
        if (intent) {
          await stripe.refunds.create({
            payment_intent: typeof intent === "string" ? intent : intent.id,
          });
        }
      } catch {
        return {
          error:
            "Stripe would not refund that. Look at it there before marking it approved.",
        };
      }
    }

    // The webhook closes the course when Stripe confirms the refund. This
    // records the decision.
  }

  const { error } = await supabase
    .from("refund_requests")
    .update({
      status: decision,
      note: String(formData.get("note") ?? "").trim() || null,
      handled_by: admin.userId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (request.profile_id) {
    const { notify } = await import("@/lib/notify");
    await notify(
      request.profile_id,
      "learning",
      decision === "approved" ? "Your refund is on its way" : "About your refund",
      decision === "approved"
        ? "It takes a few days to reach your card."
        : "There is a note on it.",
      "/learning"
    );
  }

  await record(admin.userId, `refund.${decision}`, "course_purchase", request.purchase_id, {});

  revalidatePath("/global/money");
  return { done: "saved" };
}

export async function recordPayout(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const gross = Math.round(Number(formData.get("gross") ?? 0) * 100);
  const share = Number(formData.get("share") ?? 70);

  const { error } = await supabase.from("payouts").insert({
    person_id: String(formData.get("educator_id")),
    period_start: String(formData.get("period_start")),
    period_end: String(formData.get("period_end")),
    gross_cents: gross,
    share,
    net_cents: Math.round((gross * share) / 100),
    currency: String(formData.get("currency") ?? "EUR"),
    status: String(formData.get("status") ?? "due"),
    reference: String(formData.get("reference") ?? "").trim() || null,
    paid_at:
      String(formData.get("status") ?? "due") === "paid"
        ? new Date().toISOString()
        : null,
  });

  if (error) return { error: "That payout could not be recorded. It may already exist." };

  await record(admin.userId, "payout.recorded", "profile", String(formData.get("educator_id")), {
    gross: gross / 100,
  });

  revalidatePath("/global/money");
  return { done: "saved" };
}
// The rates themselves, per Village, in the Village's own currency. The
// Global team sets them and nobody else: village_plans_write in 0055 has
// always been global admin only, which was correct and left nobody able
// to do it, because no screen in app or lib has ever written this table.
// /upgrade told a member "Your Local Admin or the Global team sets it"
// and only SQL ever could.
export async function saveVillageRate(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const villageId = String(formData.get("village_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  if (!villageId || !planId) return { error: "A Village and a plan are needed." };

  const cents = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 100);
  };

  const month = cents("month");
  const year = cents("year");
  if (month === null || year === null) {
    return { error: "A monthly and a yearly rate are both needed." };
  }

  // The founding rate is allowed to be empty, which is how a Village says
  // it has no opening rate. Blank means null rather than zero, because
  // zero is a price and null is the absence of one, and founding_open in
  // the view keys on the column being null.
  const { error } = await supabase
    .from("village_plans")
    .update({
      currency: String(formData.get("currency") ?? "EUR"),
      month_cents: month,
      year_cents: year,
      founding_month_cents: cents("founding_month"),
      founding_year_cents: cents("founding_year"),
      founding_seats: Math.max(0, Number(formData.get("founding_seats") ?? 50)),
      founding_days: Math.max(0, Number(formData.get("founding_days") ?? 90)),
    })
    .eq("village_id", villageId)
    .eq("plan_id", planId);

  if (error) return { error: error.message };

  await record(admin.userId, "village.rate.changed", "village", villageId, {
    month: month / 100,
    year: year / 100,
    currency: String(formData.get("currency") ?? "EUR"),
  });

  revalidatePath("/global/plans");
  revalidatePath("/membership");
  return { done: "saved" };
}
