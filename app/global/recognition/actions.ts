"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type RecognitionState = { error?: string; done?: string };

export async function saveAmounts(
  _prev: RecognitionState,
  formData: FormData
): Promise<RecognitionState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const rows = {
    recognition_local_admin: String(formData.get("local_admin") ?? "0"),
    recognition_circle_host: String(formData.get("circle_host") ?? "0"),
    recognition_lead: String(formData.get("lead") ?? "0"),
    recognition_currency: String(formData.get("currency") ?? "EUR"),
    recognition_paid_from: String(formData.get("paid_from") ?? ""),
  };

  for (const [key, value] of Object.entries(rows)) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return { error: error.message };
  }

  await record(admin.userId, "recognition.amounts", "settings", null, {});
  revalidatePath("/global/recognition");
  return { done: "saved" };
}

// Run this month. One payout per person, at the amount for the highest
// role they hold, and nobody is paid twice for the same month.
export async function runRecognition(
  _prev: RecognitionState,
  _formData: FormData
): Promise<RecognitionState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const [{ data: settings }, { data: due }] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase.from("recognition_due").select("profile_id, role, currency"),
  ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const currency = values.recognition_currency ?? "EUR";

  const amountFor = (role: string) => {
    const key =
      role === "local_admin"
        ? "recognition_local_admin"
        : role === "circle_host"
          ? "recognition_circle_host"
          : "recognition_lead";
    return Math.round(Number(values[key] ?? 0) * 100);
  };

  if ((due ?? []).every((row) => amountFor(row.role) === 0)) {
    return {
      error:
        "Every amount is zero, so there is nothing to pay. Set the amounts first.",
    };
  }

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  let made = 0;

  for (const row of due ?? []) {
    const amount = amountFor(row.role);
    if (amount === 0) continue;

    const { error } = await supabase.from("payouts").insert({
      person_id: row.profile_id,
      kind: "recognition",
      role: row.role,
      period_start: start,
      period_end: end,
      gross_cents: amount,
      share: 100,
      net_cents: amount,
      currency,
      status: "due",
    });

    // A duplicate means this month is already run for that person.
    if (error) continue;

    await notify(
      row.profile_id,
      "member",
      "A thank you from ExpatPreneurs",
      "Your monthly recognition is recorded and will be paid by the Global team.",
      "/lead"
    );

    made += 1;
  }

  await record(admin.userId, "recognition.run", "payout", null, { made, start });

  revalidatePath("/global/recognition");
  return { done: `${made} recorded` };
}

export async function markRecognitionPaid(
  _prev: RecognitionState,
  formData: FormData
): Promise<RecognitionState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      reference: String(formData.get("reference") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("payout_id")));

  if (error) return { error: error.message };

  await record(admin.userId, "recognition.paid", "payout", String(formData.get("payout_id")), {});
  revalidatePath("/global/recognition");
  return { done: "saved" };
}