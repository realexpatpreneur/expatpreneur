"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    // No transfer has ever actually moved anybody.
    //
    // profiles_admin_write checks is_admin(village_id) in both USING and
    // WITH CHECK, and on an update USING is evaluated against the old row
    // and WITH CHECK against the new one. So the admin of the Village
    // they are leaving passes the first and fails the second, and the
    // admin of the Village they are joining fails the first and matches
    // zero rows, which is not even an error. Either way the member stayed
    // where they were, while the request flipped to done, the audit log
    // recorded member.transferred, and they were told they had moved.
    //
    // A move is legitimately the business of both ends, which is more
    // than one row policy can express, so the check is here and the write
    // goes through the service connection.
    const mine = new Set(admin.villageIds);
    const allowed =
      admin.isGlobal ||
      mine.has(request.from_village) ||
      mine.has(request.to_village);

    if (!allowed) {
      return { error: "Only an admin of one of those two Villages can do that." };
    }

    const service = createAdminClient();

    // Their Circle is left behind, and it is needed for the task below,
    // so read it before it goes.
    const { data: before } = await service
      .from("profiles")
      .select("circle_id")
      .eq("id", request.profile_id)
      .maybeSingle();

    const { data: oldCircle } = before?.circle_id
      ? await service
          .from("circles")
          .select("name")
          .eq("id", before.circle_id)
          .maybeSingle()
      : { data: null };

    const { error: moveError } = await service
      .from("profiles")
      .update({ village_id: request.to_village, circle_id: null })
      .eq("id", request.profile_id);

    if (moveError) {
      return { error: "That move could not be completed. Nothing was changed." };
    }

    // Out of the old Village group, and out of their old Circle group,
    // which nothing used to raise at all.
    const tasks: Record<string, unknown>[] = [
      {
        village_id: request.from_village,
        profile_id: request.profile_id,
        kind: "remove",
        group_name: "Village group",
      },
    ];

    if (oldCircle?.name) {
      tasks.push({
        village_id: request.from_village,
        profile_id: request.profile_id,
        kind: "remove",
        group_name: oldCircle.name,
      });
    }

    // And into the new one. Nothing raised this either, so a transferred
    // member ended up in neither Village group.
    tasks.push({
      village_id: request.to_village,
      profile_id: request.profile_id,
      kind: "add",
      group_name: "Village group",
    });

    await service.from("whatsapp_tasks").insert(tasks);

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