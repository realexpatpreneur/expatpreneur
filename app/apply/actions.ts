"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendTemplate, url } from "@/lib/email";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export type ApplyState = { error?: string };

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const fullName = [
    String(formData.get("first_name") ?? "").trim(),
    String(formData.get("last_name") ?? "").trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const email = String(formData.get("email") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!fullName || !email || !city) {
    return { error: "Name, email and city are needed." };
  }

  const nationalities = list(formData.get("nationalities"));
  if (nationalities.length > 5) {
    return { error: "Up to five nationalities." };
  }

  // A field nobody can see. Anything that fills it in is not a person.
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/apply/sent");
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

  const { data: recent } = await supabase
    .from("applications")
    .select("id, created_at")
    .eq("email", email)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .limit(1);

  if (recent?.length) {
    return {
      error:
        "We already have a request from this address today. One is enough, and somebody is reading it.",
    };
  }

  const { data: saved, error } = await supabase.from("applications").insert({
    full_name: fullName,
    email,
    phone: String(formData.get("phone") ?? "").trim() || null,
    city,
    country: String(formData.get("country") ?? "").trim() || null,
    village_id: villageId,
    business_name: String(formData.get("business_name") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    nationalities,
    languages: list(formData.get("languages")),
    answers: {
      role: String(formData.get("role") ?? ""),
      stage: String(formData.get("stage") ?? ""),
      lived_in: list(formData.get("lived_in")),
      about_business: String(formData.get("about_business") ?? ""),
      challenge: String(formData.get("challenge") ?? ""),
      link: String(formData.get("link") ?? ""),
      why_join: String(formData.get("why_join") ?? ""),
      contribute: String(formData.get("contribute") ?? ""),
      heard_about: String(formData.get("heard_about") ?? ""),
      referrer: String(formData.get("referrer") ?? ""),
      resonate: formData.getAll("resonate").map(String),
      attend: String(formData.get("attend") ?? ""),
      conduct: formData.get("conduct") ? "Agreed" : "Not agreed",
      values: [
        formData.get("people") ? "People before transactions" : "",
        formData.get("contribute_value") ? "Contribute as well as receive" : "",
        formData.get("not_dating") ? "Professional, not a dating space" : "",
      ].filter(Boolean),
      offers_admin: formData.get("offers_admin") ? "Yes" : "No",
    },
  })
    .select("reference")
    .maybeSingle();

  if (error) {
    return { error: "That did not send. Please try again in a moment." };
  }

  await sendTemplate(
    "received",
    email,
    {
      first_name: fullName.split(" ")[0],
      reference: saved?.reference ?? "",
    },
    {
      subject: "We have your request",
      title: "Thank you for asking",
      lines: [
        `Your request to join ExpatPreneurs is with us, ${fullName.split(" ")[0]}.`,
        "Someone reads every one, so it takes a few days rather than a few minutes. You will hear either way.",
        `Your reference is ${saved?.reference ?? ""}. Keep it: with your email address it shows you where your request stands.`,
      ],
      action: { label: "Check where it stands", href: url("/apply/status") },
    }
  );

  redirect(`/apply/sent?ref=${saved?.reference ?? ""}`);
}