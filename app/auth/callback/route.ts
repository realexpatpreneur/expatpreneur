import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Where an emailed link lands: an invitation, a magic link, a password
// reset, an email change.
//
// This only ever handled `?code=`, which is the PKCE shape. An invitation
// is minted server side through the admin API, so there is no PKCE
// verifier stored in the person's browser, and GoTrue answers that by
// putting the tokens in the URL fragment instead. A fragment is never
// sent to the server, so this route saw no code, fell through, and sent
// the person to /login?error=link. They have no password, so the only way
// on from there was to find the reset page unaided.
//
// So all three shapes are handled: the code, the token hash that the
// newer email templates send, and the fragment, which has to be read in
// the browser because nothing else can see it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/home";

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorDescription = searchParams.get("error_description");

  // GoTrue refused it outright: expired, already used, wrong address.
  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  // Neither, which means the tokens are in the fragment. A browser keeps
  // a fragment across a redirect, so handing it to a page that runs in
  // the browser is enough.
  return NextResponse.redirect(
    `${origin}/auth/finish?next=${encodeURIComponent(next)}`
  );
}
