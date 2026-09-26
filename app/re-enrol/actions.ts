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
    .select("id, village_id, full_name, phone, status")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "That link is not one of ours." };
  if (invite.status === "re_enrolled") {
    return { error: "This place has already been confirmed. Try signing in." };
  }

  // Their account. They set a password here rather than waiting for a
  // link, because they are being asked to do this once and be done.
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  let userId = created?.user?.id;

  if (createError) {
    const { data: list } = await service.auth.admin.listUsers();
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!existing) return { error: createError.message };
    userId = existing.id;
    await service.auth.admin.updateUserById(existing.id, { password });
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
      status: "onboarding",
      plan: "member",
      founding: true,
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

  // Sign them in on this device, so they land in their own profile
  // rather than at a sign in page.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

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