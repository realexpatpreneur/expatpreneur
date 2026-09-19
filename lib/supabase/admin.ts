import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role client. Server side only: it bypasses every access rule,
// so it is used for the few things a signed in member cannot do for
// themselves, such as creating an account when an invitation is approved.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel, server side only."
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}