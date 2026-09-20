"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type VillageSettingsState = { error?: string; done?: string };

// What a Local Admin may change about their own Village. Its name, city and
// status stay with the Global team, because those decide what the network
// looks like from outside.
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
      summary: String(formData.get("summary") ?? "").trim() || null,
      welcome_message: String(formData.get("welcome_message") ?? "").trim() || null,
      whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
      meeting_note: String(formData.get("meeting_note") ?? "").trim() || null,
      quiet_days: Math.max(14, Number(formData.get("quiet_days") ?? 45)),
    })
    .eq("id", villageId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { done: "saved" };
}

// A Local Admin writing to the Global team. It lands where the team
// already looks, rather than in somebody's inbox.
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

  // The Global team hears about it rather than finding it later.
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