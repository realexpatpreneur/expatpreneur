"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type ReportState = { error?: string; done?: string };

// A Local Admin handling a report privately, or sending it up. Serious
// cases go to the Global team rather than being settled in a Village.
export async function handleReport(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("report_id"));
  const status = String(formData.get("status"));
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } = await supabase
    .from("reports")
    .update({ status, action_note: note, handled_by: admin.userId })
    .eq("id", id);

  if (error) {
    return { error: "That was refused. The report may already be with Global." };
  }

  if (status === "escalated") {
    const service = createAdminClient();
    const { data: team } = await service
      .from("member_roles")
      .select("profile_id")
      .eq("role", "global_admin")
      .is("ended_at", null);

    for (const person of team ?? []) {
      await notify(
        person.profile_id,
        "report",
        "A report has been escalated",
        note ?? "A Local Admin has sent this one up.",
        "/global/moderation"
      );
    }
  }

  // /report promises "They will come back to you." Nothing ever reached
  // the reporter: no notification, no email, and no page where a member
  // could see what became of it. Closing one is the moment to say so,
  // without naming anybody or saying what was done, which is the same
  // care the report page itself takes.
  if (status === "closed") {
    try {
      const service = createAdminClient();
      const { data: report } = await service
        .from("reports")
        .select("reporter_id")
        .eq("id", id)
        .maybeSingle();

      if (report?.reporter_id) {
        await notify(
          report.reporter_id,
          "report",
          "Your report has been looked at",
          "It has been dealt with. Thank you for telling us.",
          "/report"
        );
      }
    } catch {
      // The decision stands either way.
    }
  }

  await record(admin.userId, `report.${status}`, "report", id, {});

  revalidatePath("/admin/reports");
  return { done: "saved" };
}