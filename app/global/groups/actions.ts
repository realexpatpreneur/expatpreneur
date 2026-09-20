"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { slugify } from "@/lib/events";

export type GroupAdminState = { error?: string };

export async function saveGroup(
  _prev: GroupAdminState,
  formData: FormData
): Promise<GroupAdminState> {
  await requireGlobal();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  if (!name || !industry) return { error: "A name and an industry are needed." };

  const id = String(formData.get("id") ?? "");
  const row = {
    name,
    industry,
    description: String(formData.get("description") ?? "").trim() || null,
    lead_id: String(formData.get("lead_id") ?? "") || null,
    whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "forming"),
  };

  const { error } = id
    ? await supabase.from("industry_groups").update(row).eq("id", id)
    : await supabase
        .from("industry_groups")
        .insert({ ...row, slug: slugify(name) });

  if (error) return { error: error.message };

  revalidatePath("/global/groups");
  redirect("/global/groups?done=1");
}

export async function savePod(
  _prev: GroupAdminState,
  formData: FormData
): Promise<GroupAdminState> {
  await requireGlobal();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "A name is needed." };

  const id = String(formData.get("id") ?? "");
  const row = {
    name,
    purpose: String(formData.get("purpose") ?? "").trim() || null,
    village_id: String(formData.get("village_id") ?? "") || null,
    lead_id: String(formData.get("lead_id") ?? "") || null,
    capacity: Number(formData.get("capacity") ?? 8),
    cadence: String(formData.get("cadence") ?? "monthly"),
    whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "forming"),
  };

  const { error } = id
    ? await supabase.from("pods").update(row).eq("id", id)
    : await supabase.from("pods").insert({ ...row, slug: slugify(name) });

  if (error) return { error: error.message };

  revalidatePath("/global/groups");
  redirect("/global/groups?done=1");
}