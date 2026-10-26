"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, TOO_MANY } from "@/lib/guard";
import { addToNewsletter } from "@/lib/flodesk";

export type SubscribeState = { error?: string };

// The newsletter sign up. Nothing here reveals whether an address is
// already on the list.
export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  if (await tooManyTries("newsletter", 5)) return { error: TOO_MANY };

  if (String(formData.get("website") ?? "").trim()) {
    redirect("/media/subscribed");
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "An email address is needed." };

  const supabase = await createClient();

  const source = String(formData.get("source") ?? "media");

  // A duplicate is not an error the person needs to hear about.
  await supabase.from("newsletter_signups").insert({ email, source });

  // The list proper lives in Flodesk. This never throws, so a signup is
  // never lost to somebody else's outage, and it does nothing at all until
  // the key is set.
  await addToNewsletter(email, source);

  redirect("/media/subscribed");
}