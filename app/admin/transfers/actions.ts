"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type TransferAdminState = { error?: string };

// Arranging a move: the member changes Village here, not by hand in the
// database, so the WhatsApp task and the audit line both happen.
export async function handleTransfer(
  _prev: TransferAdminState,
  formData: FormData
): Promise<TransferAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("transfer_id"));
  const decision = String(formData.get("decision"));

  const { data: request } = await supabase
    .from("transfer_requests")
    .select("id, profile_id, from_village, to_village")
    .eq("id", id)
    .maybeSingle();

  if (!request) return { error: "That request is not there any more." };

  const { error } = await supabase
    .from("transfer_requests")
    .update({ status: decision, handled_by: admin.userId })
    .eq("id", id);

  if (error) return { error: error.message };

  if (decision === "done") {
    // The member moves Village and leaves their Circle behind; the new
    // Local Admins place them.
    await supabase
      .from("profiles")
      .update({ village_id: request.to_village, circle_id: null })
      .eq("id", request.profile_id);

    await supabase.from("whatsapp_tasks").insert({
      village_id: request.from_village,
      profile_id: request.profile_id,
      kind: "remove",
      group_name: "Village group",
    });

    await record(admin.userId, "member.transferred", "profile", request.profile_id, {
      from: request.from_village,
      to: request.to_village,
    });
  }

  await notify(
    request.profile_id,
    "member",
    decision === "done"
      ? "Your transfer is done"
      : decision === "declined"
        ? "About your transfer"
        : "Your transfer is being arranged",
    decision === "done"
      ? "You are in your new Village. A Local Admin will place you in a Circle."
      : "A Local Admin has picked it up.",
    "/settings/transfer"
  );

  revalidatePath("/admin/transfers");
  return {};
}