"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type VillageSettingsState = { error?: string; done?: string };

// The fields the prototype's Village settings screen carries: name, time
// zone, default visitor places and the description. Circle capacity is
// shown locked, because it is the same for every Village.
export async function saveVillageSettings(
  _prev: VillageSettingsState,
  formData: FormData
): Promise<VillageSettingsState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageId = String(formData.get("village_id"));
  if (!admin.villageIds.includes(villageId) && !admin.isGlobal) {
    return { error: "That is not your Village." };
  }

  const { error } = await supabase
    .from("villages")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      timezone: String(formData.get("timezone") ?? "Asia/Dubai"),
      visitor_places: Math.max(0, Number(formData.get("visitor_places") ?? 6)),
      summary: String(formData.get("summary") ?? "").trim() || null,
    })
    .eq("id", villageId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { done: "saved" };
}

export async function writeToGlobal(
  _prev: VillageSettingsState,
  formData: FormData
): Promise<VillageSettingsState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A subject and the message are needed." };

  const { error } = await supabase.from("suggestions").insert({
    author_id: admin.userId,
    about: "global",
    village_id: admin.homeVillageId ?? admin.villageIds[0] ?? null,
    title,
    body,
    to_global: true,
  });

  if (error) return { error: error.message };

  const service = createAdminClient();
  const { data: team } = await service
    .from("member_roles")
    .select("profile_id")
    .eq("role", "global_admin")
    .is("ended_at", null);

  for (const person of team ?? []) {
    await notify(
      person.profile_id,
      "suggestion",
      `From a Local Admin: ${title}`,
      body.slice(0, 120),
      "/global/suggestions"
    );
  }

  revalidatePath("/admin/settings");
  return { done: "sent" };
}