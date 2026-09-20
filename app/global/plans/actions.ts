"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";

export type PlanState = { error?: string; done?: string };

// What a plan costs, and what it says it gives you. The price here is what
// members are told; Stripe still charges from its own price, and the id of
// that price is kept beside it so the two cannot drift silently.
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
      stripe_price_id: String(formData.get("stripe_price_id") ?? "").trim() || null,
      features,
      active: Boolean(formData.get("active")),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await record(admin.userId, "plan.changed", "plan", id, {
    price: Number(formData.get("price") ?? 0),
    currency: String(formData.get("currency") ?? "EUR"),
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

    if (purchase?.provider_ref) {
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
    educator_id: String(formData.get("educator_id")),
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