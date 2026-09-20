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
    const { data: me } = await service
      .from("profiles")
      .select("village_id")
      .eq("id", user.id)
      .maybeSingle();

    const { data: admins } = await service
      .from("member_roles")
      .select("profile_id, role, scope_id")
      .is("ended_at", null)
      .in("role", ["local_admin", "global_admin"]);

    for (const admin of admins ?? []) {
      const relevant =
        admin.role === "global_admin" || admin.scope_id === me?.village_id;
      if (!relevant) continue;
      await notify(
        admin.profile_id,
        "report",
        "A member reported something",
        "It is waiting in moderation.",
        "/global/moderation"
      );
    }
  } catch {
    // The report is saved either way.
  }

  redirect("/report?done=1");
}