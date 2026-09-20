"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type LeadershipState = { error?: string; done?: string };

// A Local Admin puts somebody forward. The Global team gives roles, so
// this is a suggestion rather than an appointment, and the member is not
// told unless it goes ahead.
export async function suggestLeader(
  _prev: LeadershipState,
  formData: FormData
): Promise<LeadershipState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const profileId = String(formData.get("profile_id"));
  const role = String(formData.get("role"));
  const why = String(formData.get("why") ?? "").trim() || null;

  const { error } = await supabase.from("leadership_suggestions").insert({
    profile_id: profileId,
    village_id: admin.homeVillageId ?? admin.villageIds[0] ?? null,
    suggested_by: admin.userId,
    role,
    why,
  });

  if (error) {
    return { error: "You have already put this member forward for that role." };
  }

  const service = createAdminClient();
  const [{ data: person }, { data: team }] = await Promise.all([
    service.from("profiles").select("full_name").eq("id", profileId).maybeSingle(),
    service
      .from("member_roles")
      .select("profile_id")
      .eq("role", "global_admin")
      .is("ended_at", null),
  ]);

  for (const globalAdmin of team ?? []) {
    await notify(
      globalAdmin.profile_id,
      "member",
      `Suggested for a role: ${person?.full_name ?? "A member"}`,
      why ?? "A Local Admin has put them forward.",
      "/global/roles"
    );
  }

  revalidatePath("/admin/leadership");
  return { done: "sent" };
}