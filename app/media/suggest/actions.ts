"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StoryState = { error?: string };

// A member says there is a story here. The Media team decides.
export async function suggestStory(
  _prev: StoryState,
  formData: FormData
): Promise<StoryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/media/suggest");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Tell them what the story is first." };

  const { error } = await supabase.from("story_suggestions").insert({
    profile_id: user.id,
    about: String(formData.get("about") ?? "me"),
    body,
  });

  if (error) return { error: "That did not send. Try again in a moment." };

  redirect("/media/suggest?done=1");
}