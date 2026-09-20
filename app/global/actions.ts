"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";

export type GlobalState = { error?: string };

export async function saveVillage(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  await requireGlobal();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!name || !city || !country) {
    return { error: "A name, a city and a country are needed." };
  }

  const id = String(formData.get("id") ?? "");
  const row = {
    name,
    city,
    country,
    timezone: String(formData.get("timezone") ?? "UTC"),
    status: String(formData.get("status") ?? "exploring"),
    summary: String(formData.get("summary") ?? "").trim() || null,
  };

  const slug =
    String(formData.get("slug") ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { error } = id
    ? await supabase.from("villages").update(row).eq("id", id)
    : await supabase.from("villages").insert({ ...row, slug });

  if (error) return { error: error.message };

  revalidatePath("/global/villages");
  redirect("/global/villages?done=1");
}

// Roles are the Global team's alone to hand out, including Local Admin.
export async function assignRole(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const profileId = String(formData.get("profile_id"));
  const role = String(formData.get("role"));
  const scopeId = String(formData.get("scope_id") ?? "") || null;
  const scope = role === "global_admin" ? "global" : scopeId ? "village" : "global";

  const { error } = await supabase.from("member_roles").insert({
    profile_id: profileId,
    role,
    scope,
    scope_id: scope === "global" ? null : scopeId,
    review_on: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  if (error) {
    return { error: "That role is already held, or the details do not match." };
  }

  await record(admin.userId, "role.given", "profile", profileId, {
    role,
    scope,
    scope_id: scope === "global" ? null : scopeId,
  });

  revalidatePath("/global/roles");
  return {};
}

export async function endRole(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const roleId = String(formData.get("role_id"));
  const { data: ended, error } = await supabase
    .from("member_roles")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", roleId)
    .select("profile_id, role")
    .maybeSingle();

  if (error) return { error: error.message };

  await record(admin.userId, "role.ended", "profile", ended?.profile_id ?? null, {
    role: ended?.role,
  });

  revalidatePath("/global/roles");
  return {};
}

export async function updateReport(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: String(formData.get("status") ?? "in_progress"),
      action_note: String(formData.get("note") ?? "").trim() || null,
      handled_by: admin.userId,
    })
    .eq("id", String(formData.get("report_id")));

  if (error) return { error: error.message };

  await record(
    admin.userId,
    "report.handled",
    "report",
    String(formData.get("report_id")),
    {
      status: String(formData.get("status") ?? "in_progress"),
      note: String(formData.get("note") ?? "").trim() || null,
    }
  );

  revalidatePath("/global/moderation");
  return {};
}

export async function updateCity(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("city_suggestions")
    .update({
      status: String(formData.get("status") ?? "watching"),
      note: String(formData.get("note") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("city_id")));

  if (error) return { error: error.message };

  revalidatePath("/global/cities");
  return {};
}