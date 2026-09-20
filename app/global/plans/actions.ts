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