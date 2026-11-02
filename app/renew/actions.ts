"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, stripeReady } from "@/lib/stripe";

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

  // Saying you are leaving used to write the word and nothing else. The
  // page then said a Local Admin would be in touch about the last
  // details, while Stripe carried on taking the money every month, and
  // the only place the decision existed was a list in the admin. The one
  // button that could actually cancel lives on /upgrade, and it never
  // rendered, because the subscriptions table it reads was empty.
  //
  // So this ends it, at the end of the period they have already paid for.
  if (answer === "leaving" && stripeReady) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("provider_subscription, status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (subscription?.provider_subscription && subscription.status !== "cancelled") {
      try {
        await getStripe().subscriptions.update(subscription.provider_subscription, {
          cancel_at_period_end: true,
        });

        // Stripe answers with customer.subscription.updated carrying
        // cancel_at, and the webhook writes it down. No second source of
        // truth here.
      } catch {
        // The answer is recorded either way. An admin picking this up
        // from the care list is the fallback, as it always was.
      }
    }
  }

  revalidatePath("/renew");
  redirect(`/renew?done=${answer}`);
}