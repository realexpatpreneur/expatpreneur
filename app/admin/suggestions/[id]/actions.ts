"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type SuggestionAdminState = { error?: string };

export async function updateSuggestion(
  _prev: SuggestionAdminState,
  formData: FormData
): Promise<SuggestionAdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("suggestions")
    .update({
      status: String(formData.get("status") ?? "read"),
      admin_note: String(formData.get("note") ?? "").trim() || null,
      to_global: Boolean(formData.get("to_global")),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // "Send it as yourself. The admins see your name and can reply and
  // thank you." There was no reply: the note field is labelled "Note for
  // the other admins" and nothing ever reached the author. Somebody who
  // put their name to a suggestion now hears that it was read.
  //
  // Anonymous suggestions have no author by constraint, so there is
  // nobody to tell, which is the point of choosing it.
  try {
    const service = createAdminClient();
    const { data: suggestion } = await service
      .from("suggestions")
      .select("author_id, status")
      .eq("id", id)
      .maybeSingle();

    if (suggestion?.author_id) {
      await notify(
        suggestion.author_id,
        "suggestion",
        "Your suggestion was read",
        suggestion.status === "done"
          ? "It has been acted on. Thank you for sending it."
          : "Thank you for sending it.",
        "/suggestions"
      );
    }
  } catch {
    // The admin's decision is saved either way.
  }

  revalidatePath("/admin/suggestions");
  redirect(`/admin/suggestions/${id}?done=1`);
}