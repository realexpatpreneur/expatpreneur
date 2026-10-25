"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import { tooManyTries, TOO_MANY } from "@/lib/guard";

export type StatusState = {
  answer?: string;
  // Only set when the answer is 'approved': whether the link they were
  // sent still stands, or has run out and needs sending again.
  invite?: string;
  email?: string;
  reference?: string;
  error?: string;
};

export type ResendState = { sent?: boolean; error?: string };

// Both halves or nothing. Knowing somebody's email address is not enough
// to find out where their request stands.
export async function checkStatus(
  _prev: StatusState,
  formData: FormData
): Promise<StatusState> {
  const email = String(formData.get("email") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();

  if (!email || !reference) {
    return { error: "Both the email address and the reference are needed." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("application_status_for", {
    the_email: email,
    the_reference: reference,
  });

  if (error) return { error: "That could not be checked just now." };
  if (!data) {
    return {
      error:
        "Nothing matches those two. Check the reference in the email we sent when you asked.",
    };
  }

  const answer = data as string;
  if (answer !== "approved") return { answer };

  // An acceptance stands for fourteen days. Past that they ask for
  // another link rather than filling the form in again.
  const { data: invite } = await supabase.rpc("invitation_state_for", {
    the_email: email,
    the_reference: reference,
  });

  return {
    answer,
    invite: (invite as string) ?? "live",
    email,
    reference,
  };
}

// Another link for somebody whose acceptance has not lapsed as a
// decision, only as a link. No second expression of interest.
export async function requestNewInvitation(
  _prev: ResendState,
  formData: FormData
): Promise<ResendState> {
  if (await tooManyTries("invite-again", 5)) return { error: TOO_MANY };

  const email = String(formData.get("email") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  if (!email || !reference) {
    return { error: "Both the email address and the reference are needed." };
  }

  const supabase = await createClient();
  const { data: state } = await supabase.rpc("invitation_state_for", {
    the_email: email,
    the_reference: reference,
  });

  if (state === "joined") {
    return { error: "This one has already been used. Sign in instead." };
  }
  if (state !== "expired" && state !== "live") {
    return { error: "There is no invitation on this one to send again." };
  }

  const service = createAdminClient();
  const { data: application } = await service
    .from("applications")
    .select("id, invites_sent")
    .eq("email", email)
    .eq("reference", reference.toUpperCase())
    .maybeSingle();

  if (!application) return { error: "There is nothing to send again." };

  const { error: sendError } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/home`,
  });
  if (sendError) return { error: "That could not be sent just now." };

  const now = new Date();
  const until = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  await service
    .from("applications")
    .update({
      invited_at: now.toISOString(),
      invite_expires_at: until.toISOString(),
      invites_sent: (application.invites_sent ?? 0) + 1,
    })
    .eq("id", application.id);

  return { sent: true };
}