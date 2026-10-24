# 141-why-you-cannot-sign-in.ps1
# The login page told you to check the address, which was almost
# certainly not the problem. No migration.
#
# The action caught every possible failure and printed one sentence.
# There are three quite different reasons a link can fail and only one
# of them is a typo:
#
#   the address belongs to nobody, which is the person's to fix
#   too many attempts, which is time
#   Supabase could not send the email, which is ours
#
# The third is what you are hitting. A sign in link is an email, and
# email is not connected to this site yet. Supabase's own sending is
# not set up, so the request fails whatever address you use, including
# yours. The page now says which of the three happened, in plain words.
#
# So the login page has a password again. Two tabs: with a password,
# which always works, and email me a link, which will work the day
# Resend is connected. Signing in with a password now actually takes
# you where you were going, which it did not before: it signed you in
# and then sat on the page.
#
# To set your own password, in Supabase, SQL editor:
#   C:\Users\HP\Desktop\expatpreneur\supabase\setup\set-your-password.sql
# Change the password and the address in it first.
#
# The other way, without SQL: Supabase, Authentication, Users, find
# your account, and send a recovery or set a password there.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\app\login\actions.ts
#   C:\Users\HP\Desktop\expatpreneur\app\login\form.tsx
#   C:\Users\HP\Desktop\expatpreneur\supabase\setup\set-your-password.sql
#
#   powershell -ExecutionPolicy Bypass -File .\141-why-you-cannot-sign-in.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $full"
}

$f0 = @'
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
'@
Write-File "app\login\actions.ts" $f0

$f1 = @'
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendSignInLink, signInWithPassword, type LoginState } from "./actions";

// Two ways in. The link is the nicer one and needs email to be working;
// the password is the one that always works, which matters while email
// is not connected.
export function LoginForm({ next }: { next: string }) {
  const [how, setHow] = useState<"password" | "link">("password");

  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(
    sendSignInLink,
    {}
  );
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(
    signInWithPassword,
    {}
  );

  if (linkState.sent) {
    return (
      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="flag ok">
          Check your email. The link signs you in and lasts one hour.
        </div>
        <p className="muted small">Nothing arrived? Look in spam, then try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="pb-tabs" style={{ maxWidth: 520, marginBottom: 14 }}>
        <button
          type="button"
          className={how === "password" ? "on" : ""}
          onClick={() => setHow("password")}
        >
          With a password
        </button>
        <button
          type="button"
          className={how === "link" ? "on" : ""}
          onClick={() => setHow("link")}
        >
          Email me a link
        </button>
      </div>

      {how === "password" ? (
        <form action={pwAction} className="panel" style={{ maxWidth: 520 }}>
          {pwState.error ? <div className="flag hold">{pwState.error}</div> : null}
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={pwPending}>
            {pwPending ? "Signing in" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={linkAction} className="panel" style={{ maxWidth: 520 }}>
          {linkState.error ? <div className="flag hold">{linkState.error}</div> : null}
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
            <span className="hint">Use the address your invitation was sent to.</span>
          </label>
          <button className="btn btn-primary" type="submit" disabled={linkPending}>
            {linkPending ? "Sending" : "Email me a link"}
          </button>
          <p className="muted small" style={{ marginTop: 10 }}>
            A link needs email to be connected. Until then, use a password.
          </p>
        </form>
      )}

      <p className="muted small" style={{ marginTop: 12 }}>
        Forgotten your password? <Link href="/reset-password">Reset it here</Link>.
      </p>
    </>
  );
}
'@
Write-File "app\login\form.tsx" $f1

$f2 = @'
-- Setting a password for your own account.
--
-- Sign in links need email, and email is not connected yet, so the way
-- in is a password. This sets one for a single account.
--
-- Change both values before running it. Use a real password, not this
-- one, and change it again in Settings once you are in.

update auth.users
set encrypted_password = crypt('change-this-to-a-real-password', gen_salt('bf')),
    updated_at = now()
where email = 'realexpatpreneur@gmail.com';

-- Check it took. One row, with a password set.
select email, (encrypted_password is not null) as has_password, last_sign_in_at
from auth.users
where email = 'realexpatpreneur@gmail.com';
'@
Write-File "supabase\setup\set-your-password.sql" $f2

git add app supabase
git commit -m "Say why a sign in failed, and put the password back on the login page"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Nothing to run in Supabase unless you want to set a"
    Write-Host "password with the SQL file above."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
