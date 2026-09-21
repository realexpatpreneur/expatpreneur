"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ContactState = { error?: string };

const KINDS = ["general", "partnership", "press"] as const;

export async function sendEnquiry(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // A field nobody can see. Anything that fills it in is not a person.
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/contact/sent");
  }

  const kind = String(formData.get("kind") ?? "general");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !email || !message) {
    return { error: "Your name, your email and a message are needed." };
  }

  const supabase = await createClient();

  const villageSlug = String(formData.get("village") ?? "");
  let villageId: string | null = null;
  if (villageSlug) {
    const { data } = await supabase
      .from("villages")
      .select("id")
      .eq("slug", villageSlug)
      .maybeSingle();
    villageId = data?.id ?? null;
  }

  const { error } = await supabase.from("enquiries").insert({
    kind: (KINDS as readonly string[]).includes(kind) ? kind : "general",
    full_name: fullName,
    email,
    organisation: String(formData.get("organisation") ?? "").trim() || null,
    village_id: villageId,
    message,
  });

  if (error) {
    return { error: "That did not send. Please try again in a moment." };
  }

  redirect(`/contact/sent?kind=${kind}`);
}