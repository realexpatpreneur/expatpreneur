"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tooManyTries, captchaPassed, TOO_MANY } from "@/lib/guard";
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

  // A person does not send this 4 times in an hour.
  if (await tooManyTries("invitation", 3)) return { error: TOO_MANY };

  if (!(await captchaPassed(String(formData.get("cf-turnstile-response") ?? "") || null))) {
    return { error: "The check did not pass. Please try again." };
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

  // applications has no read policy an unsigned visitor satisfies, so this
  // ran as anon and came back empty every time rather than erroring. The
  // one a day guard has never fired. The same role problem is why the
  // insert below could never save a row, so both go through the service
  // role, behind the honeypot, the captcha and the three an hour counter
  // that already guard this action.
  const service = createAdminClient();

  const { data: recent } = await service
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

  // This asks for the row back, because the reference is set by a before
  // insert trigger and the confirmation email quotes it. Asking makes
  // Postgres check the new row against the select policy, and there is
  // none that anon satisfies, so the whole statement aborted and not one
  // expression of interest was ever saved. Every other public form on the
  // site inserts without asking for the row back, which is why they work.
  const { data: saved, error } = await service.from("applications").insert({
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
      // These two are the applicant's own words about what they need and
      // what they offer. With consent they become their introduction.
      looking_for: String(formData.get("looking_for") ?? ""),
      can_help_with: String(formData.get("can_help_with") ?? ""),
      share_answers: formData.get("share_answers") ? "Yes" : "No",
      heard_about: String(formData.get("heard_about") ?? ""),
      referrer: String(formData.get("referrer") ?? ""),
      resonate: formData.getAll("resonate").map(String),
      attend: String(formData.get("attend") ?? ""),
      code_of_conduct: String(formData.get("code_of_conduct") ?? ""),
      conduct: formData.get("conduct") ? "Agreed" : "Not agreed",
      values: [
        formData.get("people") ? "People before transactions" : "",
        formData.get("contribute_value") ? "Contribute as well as receive" : "",
        formData.get("not_dating") ? "Professional, not a dating space" : "",
      ].filter(Boolean),
      offers_admin: formData.get("offers_admin") ? "Yes" : "No",
      city_entrepreneurs: String(formData.get("city_entrepreneurs") ?? ""),
      city_english: String(formData.get("city_english") ?? ""),
      la_years: String(formData.get("la_years") ?? ""),
      la_hours: String(formData.get("la_hours") ?? ""),
      la_experience: String(formData.get("la_experience") ?? ""),
      la_why: String(formData.get("la_why") ?? ""),
      la_partner: String(formData.get("la_partner") ?? ""),
    },
  })
    .select("reference")
    .maybeSingle();

  if (error) {
    return { error: "That did not send. Please try again in a moment." };
  }

  // The form promises "we will add your city to our list of suggestions"
  // to somebody whose city has no Village. It never did: the application
  // row was the only thing written, and the list the Global team reads at
  // /global/cities is city_suggestions, which only the suggest form has
  // ever written to. So the city went nowhere and the application could
  // not even be approved, because approving needs a Village.
  //
  // Only when there is no Village. A city that already has one does not
  // need suggesting.
  if (!villageId) {
    const country = String(formData.get("country") ?? "").trim();
    await service.from("city_suggestions").insert({
      city,
      country: country || "Not given",
      name: fullName,
      email,
      offers_admin: false,
      note: "From an invitation request for a city with no Village yet.",
    });
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