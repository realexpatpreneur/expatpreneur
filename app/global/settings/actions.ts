"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";

export type SystemState = { error?: string; done?: string };

// Every system setting is a row in settings, so adding one later is a
// row rather than a migration.
async function put(keys: Record<string, string>) {
  const supabase = await createClient();
  for (const [key, value] of Object.entries(keys)) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return error.message;
  }
  return null;
}

export async function saveGeneral(
  _prev: SystemState,
  formData: FormData
): Promise<SystemState> {
  const admin = await requireGlobal();

  const problem = await put({
    network_name: String(formData.get("network_name") ?? "").trim(),
    domain: String(formData.get("domain") ?? "").trim(),
    default_language: String(formData.get("default_language") ?? "English"),
    languages_prepared: String(formData.get("languages_prepared") ?? "").trim(),
    support_email: String(formData.get("support_email") ?? "").trim(),
  });

  if (problem) return { error: problem };

  await record(admin.userId, "settings.general", "settings", null, {});
  revalidatePath("/global/settings");
  return { done: "saved" };
}

export async function saveIntegration(
  _prev: SystemState,
  formData: FormData
): Promise<SystemState> {
  const admin = await requireGlobal();

  const key = String(formData.get("key"));
  const problem = await put({
    [key]: String(formData.get("value") ?? "").trim() || "Not chosen yet",
  });

  if (problem) return { error: problem };

  await record(admin.userId, "settings.integration", "settings", null, { key });
  revalidatePath("/global/settings");
  return { done: "saved" };
}

export async function saveSecurity(
  _prev: SystemState,
  formData: FormData
): Promise<SystemState> {
  const admin = await requireGlobal();

  const problem = await put({
    two_step_leaders: formData.get("two_step_leaders") ? "on" : "off",
    two_step_members: formData.get("two_step_members") ? "on" : "off",
    daily_backups: formData.get("daily_backups") ? "on" : "off",
    access_ends_with_role: formData.get("access_ends_with_role") ? "on" : "off",
  });

  if (problem) return { error: problem };

  await record(admin.userId, "settings.security", "settings", null, {});
  revalidatePath("/global/settings");
  return { done: "saved" };
}