"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type TransferState = { error?: string };

// Moving city keeps everything: the profile, the history, the connections.
// Only the Village and the Circle change, and two sets of admins arrange it.
export async function requestTransfer(
  _prev: TransferState,
  formData: FormData
): Promise<TransferState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/transfer");

  const toVillage = String(formData.get("to_village") ?? "");
  if (!toVillage) return { error: "Choose where you are going." };

  const { data: me } = await supabase
    .from("profiles")
    .select("village_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.village_id === toVillage) {
    return { error: "That is the Village you are already in." };
  }

  const { error } = await supabase.from("transfer_requests").insert({
    profile_id: user.id,
    from_village: me?.village_id ?? null,
    to_village: toVillage,
    moving_on: String(formData.get("moving_on") ?? "") || null,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) return { error: "That did not send. Try again in a moment." };

  // The admins at both ends need to know, so nobody arrives unannounced.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const service = createAdminClient();
  const { data: admins } = await service
    .from("member_roles")
    .select("profile_id")
    .in("scope_id", [toVillage, me?.village_id].filter(Boolean))
    .is("ended_at", null)
    .eq("role", "local_admin");

  for (const admin of admins ?? []) {
    await notify(
      admin.profile_id,
      "member",
      `${me?.full_name ?? "A member"} is moving`,
      "They asked to transfer Village. It is on your transfers list.",
      "/admin/transfers"
    );
  }

  redirect("/settings/transfer?done=1");
}