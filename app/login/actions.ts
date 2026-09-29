"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, TOO_MANY } from "@/lib/guard";

export type LoginState = { error?: string; sent?: boolean };

export async function sendSignInLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (await tooManyTries("sign-in-link", 8)) return { error: TOO_MANY };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Your email is needed." };

  const next = String(formData.get("next") ?? "/home");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get("origin") ??
    "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Members are created when an invitation is approved, never by
      // signing in, so this does not open a back door.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // The reason matters: one of these is the person's mistake, and the
    // others are ours. Saying "check the address" for all three sends
    // somebody hunting for a typo that is not there.
    const said = `${error.message ?? ""}`.toLowerCase();

    if (said.includes("signups not allowed") || said.includes("user not found"))
      return {
        error:
          "There is no member with that address. If you were invited, use the address the invitation went to.",
      };

    if (said.includes("rate") || said.includes("too many") || error.status === 429)
      return {
        error: "Too many attempts for now. Wait a few minutes and try again.",
      };

    if (said.includes("sending") || said.includes("smtp") || (error.status ?? 0) >= 500)
      return {
        error:
          "Sending is not working yet. Email has not been connected to this site, so sign in with a password instead.",
      };

    return { error: `That did not work: ${error.message}` };
  }

  return { sent: true };
}

// Signing in with a password, for members who set one in their settings.
export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Your email and your password are both needed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        "That did not work. If you have never set a password, ask for a sign in link instead.",
    };
  }

  // Signed in, so go where they were headed.
  redirect(String(formData.get("next") ?? "/home"));
}

// Asking for a reset. The answer is the same whether or not the address
// is one of ours, so nobody can use this to find out who is a member.
export async function sendResetLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Your email is needed." };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get("origin") ??
    "http://localhost:3000";

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/settings`,
  });

  return { sent: true };
}