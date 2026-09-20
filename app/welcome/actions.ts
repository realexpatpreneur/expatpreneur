"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export type WelcomeState = { error?: string };

export async function completeProfile(
  _prev: WelcomeState,
  formData: FormData
): Promise<WelcomeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/welcome");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  if (!fullName) return { error: "Your name is needed." };
  if (!formData.get("values")) {
    return { error: "Please confirm you have read how the community works." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      headline: headline || null,
      business_name: String(formData.get("business_name") ?? "").trim() || null,
      industry: String(formData.get("industry") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      can_help_with: String(formData.get("can_help_with") ?? "").trim() || null,
      looking_for: String(formData.get("looking_for") ?? "").trim() || null,
      languages: list(formData.get("languages")),
      markets_known: list(formData.get("markets_known")),
      lived_in: list(formData.get("lived_in")),
      public_profile: Boolean(formData.get("public_profile")),
      status: "active",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/welcome/done");
}