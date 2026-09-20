"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RenewState = { error?: string };

// The member's own answer. Leaving here is a decision, not a disappearance,
// and it takes effect at the end of the cycle rather than at once.
export async function answerRenewal(
  _prev: RenewState,
  formData: FormData
): Promise<RenewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/renew");

  const answer = String(formData.get("answer") ?? "");
  if (!["staying", "leaving"].includes(answer)) {
    return { error: "Choose one." };
  }

  const { error } = await supabase
    .from("re_enrolments")
    .update({
      status: answer,
      note: String(formData.get("note") ?? "").trim() || null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("renewal_id")))
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/renew");
  redirect(`/renew?done=${answer}`);
}