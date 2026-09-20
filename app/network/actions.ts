"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NetworkState = { error?: string; done?: string };

// Asking to be told when a launching Village opens.
export async function tellMeWhenItOpens(
  _prev: NetworkState,
  formData: FormData
): Promise<NetworkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase.from("village_interest").upsert(
    {
      profile_id: user.id,
      village_id: String(formData.get("village_id")),
    },
    { onConflict: "profile_id,village_id" }
  );

  if (error) return { error: "That did not save. Try again in a moment." };

  revalidatePath("/network");
  return { done: "asked" };
}