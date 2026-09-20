"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { notify } from "@/lib/notify";
import { sendEmailToMember, url } from "@/lib/email";

export type CareState = { error?: string };

// Opening a round asks everyone active in the Village at once. Nobody is
// asked twice for the same cycle, which the database enforces.
export async function openRenewalRound(
  _prev: CareState,
  formData: FormData
): Promise<CareState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const cycle = String(formData.get("cycle") ?? "").trim();
  if (!cycle) return { error: "Name the cycle, for example 2027." };

  const villageId = admin.homeVillageId ?? admin.villageIds[0] ?? null;
  if (!villageId) return { error: "No Village to run this for." };

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("village_id", villageId)
    .eq("status", "active");

  let asked = 0;

  for (const member of members ?? []) {
    const { error } = await supabase.from("re_enrolments").insert({
      profile_id: member.id,
      village_id: villageId,
      cycle,
    });

    if (error) continue; // already asked for this cycle

    asked += 1;

    await notify(
      member.id,
      "renewal",
      "Another year?",
      "Membership is renewed by a decision, not by silence. It takes a minute.",
      "/renew"
    );

    await sendEmailToMember(
      member.id,
      "renewal",
      member.email,
      "Another year?",
      "Are you staying?",
      [
        `${member.full_name.split(" ")[0]}, it is that time of year.`,
        "Membership here is renewed by a decision rather than by silence, so we ask everyone once a year. Either answer is a good one, and it takes a minute.",
      ],
      { label: "Give your answer", href: url("/renew") }
    );
  }

  revalidatePath("/admin/care");
  redirect(`/admin/care?asked=${asked}`);
}

export async function noteOnRenewal(
  _prev: CareState,
  formData: FormData
): Promise<CareState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("re_enrolments")
    .update({
      admin_note: String(formData.get("admin_note") ?? "").trim() || null,
      status: String(formData.get("status") ?? "pending"),
    })
    .eq("id", String(formData.get("renewal_id")));

  if (error) return { error: error.message };

  revalidatePath("/admin/care");
  return {};
}