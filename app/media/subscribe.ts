"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error?: string };

// The newsletter sign up. Nothing here reveals whether an address is
// already on the list.
export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/media/subscribed");
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "An email address is needed." };

  const supabase = await createClient();

  // A duplicate is not an error the person needs to hear about.
  await supabase.from("newsletter_signups").insert({
    email,
    source: String(formData.get("source") ?? "media"),
  });

  redirect("/media/subscribed");
}