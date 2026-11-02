"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type ReportState = { error?: string };

// A report goes to the Local Admins of the member's Village and to the
// Global team. The person reported is never told who reported them.
export async function sendReport(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/report");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Tell us what happened." };

  const subjectId = String(formData.get("subject_id") ?? "") || null;

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    subject_id: subjectId,
    context: String(formData.get("context") ?? "").trim() || null,
    body,
  });

  if (error) return { error: "That did not send. Please try again." };

  // Tell the people who have to act on it, without naming anyone in the
  // notification itself.
  try {
    const service = createAdminClient();

    // The Village of the person reported, not of the person reporting.
    // That is where the report belongs, it is what the trigger in 0082
    // writes on the row, and it is therefore the only Village whose
    // Local Admins can read it. Picking the reporter's Village sent the
    // notification to admins who would open the page and find nothing,
    // and left the ones who could act on it unaware.
    const { data: subject } = subjectId
      ? await service
          .from("profiles")
          .select("village_id")
          .eq("id", subjectId)
          .maybeSingle()
      : { data: null };

    const { data: admins } = await service
      .from("member_roles")
      .select("profile_id, role, scope_id")
      .is("ended_at", null)
      .in("role", ["local_admin", "global_admin"]);

    for (const admin of admins ?? []) {
      const isGlobal = admin.role === "global_admin";
      const theirs =
        isGlobal ||
        (Boolean(subject?.village_id) && admin.scope_id === subject?.village_id);
      if (!theirs) continue;
      await notify(
        admin.profile_id,
        "report",
        "A member reported something",
        "It is waiting in moderation.",
        // A Local Admin cannot open /global/moderation; requireGlobal
        // turns them around at the door. Theirs is /admin/reports.
        isGlobal ? "/global/moderation" : "/admin/reports"
      );
    }
  } catch {
    // The report is saved either way.
  }

  redirect("/report?done=1");
}