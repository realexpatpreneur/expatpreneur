"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CityState = { error?: string };

// Anyone can say where they are, whether or not they ever apply.
export async function suggestCity(
  _prev: CityState,
  formData: FormData
): Promise<CityState> {
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!city || !country) return { error: "A city and a country are needed." };

  if (String(formData.get("website") ?? "").trim()) {
    redirect("/villages/suggest?done=1");
  }

  const supabase = await createClient();
  const offersAdmin = Boolean(formData.get("offers_admin"));

  const { error } = await supabase.from("city_suggestions").insert({
    city,
    country,
    name: String(formData.get("name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    offers_admin: offersAdmin,
    admin_answers: offersAdmin
      ? {
          about: String(formData.get("about") ?? ""),
          network: String(formData.get("network") ?? ""),
        }
      : {},
  });

  if (error) return { error: "That did not send. Please try again." };

  redirect("/villages/suggest?done=1");
}