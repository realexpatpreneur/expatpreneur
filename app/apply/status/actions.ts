"use server";

import { createClient } from "@/lib/supabase/server";

export type StatusState = { answer?: string; error?: string };

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

  return { answer: data as string };
}