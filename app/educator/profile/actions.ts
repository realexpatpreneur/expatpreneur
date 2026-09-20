"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EducatorProfileState = { error?: string; done?: string };

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// The profile shown on course pages. Separate from the member profile,
// because what makes somebody worth learning from is not what makes them
// worth meeting.
export async function saveEducatorProfile(
  _prev: EducatorProfileState,
  formData: FormData
): Promise<EducatorProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase.from("educator_profiles").upsert(
    {
      profile_id: user.id,
      headline: String(formData.get("headline") ?? "").trim() || null,
      about: String(formData.get("about") ?? "").trim() || null,
      teaches_in: list(formData.get("teaches_in")),
      markets: list(formData.get("markets")),
    },
    { onConflict: "profile_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/educator/profile");
  return { done: "saved" };
}