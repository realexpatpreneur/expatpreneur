"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

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

  revalidatePath("/admin/suggestions");
  redirect(`/admin/suggestions/${id}?done=1`);
}