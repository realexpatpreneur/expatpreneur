"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

export type ReEnrolAdminState = { error?: string; done?: string };

// The list usually arrives as a paste from WhatsApp or a spreadsheet:
// one person per line, name and then phone or email in any order.
export async function importList(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  if (!villageId) return { error: "Choose a Village first." };

  const raw = String(formData.get("people") ?? "").trim();
  if (!raw) return { error: "Nothing to add." };

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const name = parts[0] ?? "";
      const email = parts.find((p) => p.includes("@")) ?? null;
      const phone =
        parts.find((p) => /^[+0-9][0-9 ()-]{6,}$/.test(p)) ?? null;
      return { village_id: villageId, full_name: name, email, phone };
    })
    .filter((r) => r.full_name);

  if (!rows.length) return { error: "No names were found in that." };

  const supabase = await createClient();
  const { error } = await supabase.from("founding_invites").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/re-enrolment");
  return { done: `${rows.length} added` };
}

export async function remind(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "reminded", last_contact: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "reminded" };
}

export async function setDeadline(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  const date = String(formData.get("deadline") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("villages")
    .update({ reenrol_deadline: date })
    .eq("id", villageId);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "deadline" };
}

// After the deadline, the people who did not answer become removal
// tasks rather than being removed by a machine.
export async function closeOut(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];

  const supabase = await createClient();
  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "removed" })
    .eq("village_id", villageId)
    .in("status", ["invited", "reminded"]);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "closed" };
}