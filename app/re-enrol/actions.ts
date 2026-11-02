"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReEnrolState = { error?: string };

// Reading an invitation by its token has to bypass the access rules,
// because the person holding the link has no account yet. Only the one
// row matching the token is ever read.
export async function inviteByToken(token: string) {
  const service = createAdminClient();
  const { data } = await service
    .from("founding_invites")
    .select("id, full_name, phone, email, status, village_id, villages(name, city)")
    .eq("token", token)
    .maybeSingle();
  return data;
}

export async function confirmPlace(
  _prev: ReEnrolState,
  formData: FormData
): Promise<ReEnrolState> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const again = String(formData.get("password2") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !fullName) return { error: "Your name and email are needed." };
  if (password.length < 8) {
    return { error: "A password of at least eight characters, please." };
  }
  if (password !== again) return { error: "The two passwords are not the same." };
  if (!formData.get("staying") || !formData.get("values")) {
    return { error: "Both boxes need ticking before you can continue." };
  }

  const service = createAdminClient();

  const { data: invite } = await service
    .from("founding_invites")
    .select(
      "id, village_id, full_name, phone, email, status, complimentary, complimentary_reason, added_by"
    )
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "That link is not one of ours." };
  if (invite.status === "re_enrolled") {
    return { error: "This place has already been confirmed. Try signing in." };
  }

  // The address on the invitation is the one that counts. The form field
  // is a convenience, and before this it was the field, not the
  // invitation, that decided which account got touched.
  const inviteEmail = String(invite.email ?? "").trim().toLowerCase();
  if (inviteEmail && email !== inviteEmail) {
    return {
      error:
        "That is not the address this invitation was sent to. Use that one, " +
        "or ask your Local Admin to change it on the invitation.",
    };
  }

  // Who, if anyone, is signed in on this device.
  const supabase = await createClient();
  const {
    data: { user: signedIn },
  } = await supabase.auth.getUser();

  // Their account. They set a password here rather than waiting for a
  // link, because they are being asked to do this once and be done.
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  let userId = created?.user?.id;
  let needsSigningIn = true;

  if (createError) {
    // The address already has an account. The only person who may claim a
    // place with it is somebody already signed in as it.
    //
    // What stood here looked the account up by the address typed into the
    // form and then set its password. Anybody holding any valid link could
    // type a member's address, be handed their account, and have their
    // profile overwritten on the way in. listUsers returns its first page,
    // which is the earliest accounts, which is the founder and the Global
    // team.
    if (signedIn?.email?.toLowerCase() === email) {
      userId = signedIn.id;
      needsSigningIn = false;
    } else {
      return {
        error:
          "There is already an account with this address. Sign in with it " +
          "first, then open this link again.",
      };
    }
  }

  if (!userId) return { error: "The account could not be created." };

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      phone: String(formData.get("phone") ?? "") || invite.phone,
      business_name: String(formData.get("business_name") ?? "") || null,
      village_id: invite.village_id,
      // Her framework: existing community members receive pre-approved
      // invitations at the founding rate. So claiming the place sets the
      // account up and the membership begins at the payment, exactly as
      // it does for anybody approved from an expression of interest. The
      // volunteers she named are marked complimentary instead, and go
      // straight in.
      status: invite.complimentary ? "onboarding" : "invited",
      plan: "member",
      founding: true,
      complimentary: Boolean(invite.complimentary),
      complimentary_reason: invite.complimentary
        ? invite.complimentary_reason ?? "Already a member before the platform"
        : null,
      complimentary_by: invite.complimentary ? invite.added_by ?? null : null,
      complimentary_at: invite.complimentary ? new Date().toISOString() : null,
    },
    { onConflict: "id" }
  );

  if (profileError) return { error: profileError.message };

  await service
    .from("founding_invites")
    .update({
      status: "re_enrolled",
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", invite.id);
  // Sign them in on this device, so they land in their own profile rather
  // than at a sign in page. Somebody already signed in as this account
  // stays signed in; their password is not touched.
  if (needsSigningIn) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  redirect("/welcome");
}

export async function notForMe(
  _prev: ReEnrolState,
  formData: FormData
): Promise<ReEnrolState> {
  const token = String(formData.get("token") ?? "");
  const service = createAdminClient();

  const { error } = await service
    .from("founding_invites")
    .update({ status: "declined", last_contact: new Date().toISOString() })
    .eq("token", token);

  if (error) return { error: "That did not save. Please try again." };
  redirect("/re-enrol/done");
}