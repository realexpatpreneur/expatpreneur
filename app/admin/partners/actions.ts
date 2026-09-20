"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type ProposeState = { error?: string };

// A Local Admin proposes a sponsored event. Nothing is agreed with the
// partner until the Global team approves it, with conditions.
export async function proposePartneredEvent(
  _prev: ProposeState,
  formData: FormData
): Promise<ProposeState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const partner = String(formData.get("partner") ?? "").trim();
  const partnerGets = String(formData.get("partner_gets") ?? "").trim();
  const membersGet = String(formData.get("members_get") ?? "").trim();

  if (!title || !partner || !partnerGets || !membersGet) {
    return { error: "All four are needed before Global can decide." };
  }

  const { error } = await supabase.from("partnered_events").insert({
    village_id: admin.homeVillageId ?? admin.villageIds[0] ?? null,
    proposed_by: admin.userId,
    title,
    partner,
    partner_gets: partnerGets,
    members_get: membersGet,
  });

  if (error) return { error: "That could not be sent." };

  const service = createAdminClient();
  const { data: team } = await service
    .from("member_roles")
    .select("profile_id")
    .eq("role", "global_admin")
    .is("ended_at", null);

  for (const person of team ?? []) {
    await notify(
      person.profile_id,
      "event",
      `A partnered event to approve: ${title}`,
      `${partner}. Nothing is agreed until you decide.`,
      "/global/partners"
    );
  }

  redirect("/admin/partners?done=1");
}