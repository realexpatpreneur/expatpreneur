"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, captchaPassed, TOO_MANY } from "@/lib/guard";
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

  // Every other public form on the site checks this. This one writes to
  // a mailing list, so it is the one that needed it most.
  if (!(await captchaPassed(String(formData.get("cf-turnstile-response") ?? "") || null))) {
    return { error: "The check did not pass. Please try again." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "An email address is needed." };
  // The browser checks this too, but a form can be posted without one.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return { error: "That does not look like an email address." };
  }

  const supabase = await createClient();

  const source = String(formData.get("source") ?? "media").slice(0, 40);

  // One function owns the signup: it validates, and it treats signing up
  // again as a fresh consent, so somebody who unsubscribed and came back
  // is put back on rather than silently refused by the unique address.
  // It returns nothing, so it cannot be used to find out who is already
  // on the list.
  const { error } = await supabase.rpc("newsletter_signup", {
    p_email: email,
    p_source: source,
  });

  if (error) {
    // A real failure, rather than the duplicate the old code was quietly
    // swallowing. Saying so beats telling somebody to check an inbox
    // that will never have anything in it.
    console.error("Newsletter signup failed:", error.message);
    return { error: "That could not be saved just now. Please try again." };
  }

  // The list proper lives in Flodesk. This never throws, so a signup is
  // never lost to somebody else's outage, and it does nothing at all until
  // the key is set.
  await addToNewsletter(email, source);

  redirect("/media/subscribed");
}
