"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SuggestionState = { error?: string };

// Members can send a suggestion under their name or anonymously. When it
// is anonymous the author column stays empty, so there is nothing to trace
// afterwards, by anyone.
export async function sendSuggestion(
  _prev: SuggestionState,
  formData: FormData
): Promise<SuggestionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/suggestions");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A title and your suggestion are needed." };

  const anonymous = String(formData.get("how") ?? "named") === "anonymous";
  const about = String(formData.get("about") ?? "village");

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("suggestions").insert({
    author_id: anonymous ? null : user.id,
    anonymous,
    about,
    village_id: about === "village" ? profile?.village_id ?? null : null,
    title,
    body,
  });

  if (error) return { error: error.message };

  redirect(anonymous ? "/suggestions/sent?how=anonymous" : "/suggestions/sent");
}