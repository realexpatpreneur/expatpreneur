"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type PartnerState = { error?: string; done?: string };

// Sponsorships and co-branded events are approved by Global before
// anything is agreed, and the conditions are part of the approval.
export async function decidePartneredEvent(
  _prev: PartnerState,
  formData: FormData
): Promise<PartnerState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("partner_id"));
  const decision = String(formData.get("decision"));

  const { data: request } = await supabase
    .from("partnered_events")
    .select("id, title, proposed_by, partner")
    .eq("id", id)
    .maybeSingle();

  if (!request) return { error: "That request is not there any more." };

  const { error } = await supabase
    .from("partnered_events")
    .update({
      status: decision,
      conditions: String(formData.get("conditions") ?? "").trim() || null,
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (request.proposed_by) {
    await notify(
      request.proposed_by,
      "event",
      decision === "approved"
        ? `Approved: ${request.title}`
        : `Not approved: ${request.title}`,
      decision === "approved"
        ? "The conditions are on the request. They are part of the agreement."
        : "There is a note on the request.",
      "/admin/events"
    );
  }

  await record(admin.userId, `partner.${decision}`, "partnered_event", id, {
    partner: request.partner,
  });

  revalidatePath("/global/partners");
  return { done: "saved" };
}