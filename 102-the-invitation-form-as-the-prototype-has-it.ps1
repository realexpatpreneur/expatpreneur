# 102-the-invitation-form-as-the-prototype-has-it.ps1
# The form a stranger meets first. No migration.
#
# The screenshot showed it as one long column of thirty fields. The
# prototype does not do that, and I was wrong when I told you it was a
# four step wizard. It is four titled sections in a two column grid:
#
#   About you, with the person icon
#   Tell us more about your business, with the briefcase
#   Now, let us see if we are a good fit, with the tick
#   Our values, with the heart
#
# Short fields sit two to a row and long ones run the full width, which
# is what turns thirty questions into something somebody will finish.
#
# What was missing and is now there:
#
#   First name and Last name, which were one field called Your name.
#   The note under the expat journey questions explaining that your
#   nationalities, languages and the countries you have lived in are
#   what make up your journey on your profile.
#   The Village question, with There is no Village in my city yet as an
#   answer. Choosing it opens the panel the prototype shows: that we
#   will still read the request, that the city goes on the list, and a
#   box to say you would help start one.
#   The four values, which were one code of conduct tick. People before
#   transactions. Contribute as well as receive. A professional
#   community, not a dating space. The terms and the privacy policy.
#
# All of it reaches the reviewer, including who would help start a
# Village, which is the answer that decides where the next one opens.
#
#   powershell -ExecutionPolicy Bypass -File .\102-the-invitation-form-as-the-prototype-has-it.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
"use client";

import { useActionState, useState } from "react";
import { Ic } from "@/components/icon";
import { submitApplication, type ApplyState } from "./actions";

type Village = { slug: string; name: string; status: string };

const INDUSTRIES = [
  "Consulting & Coaching",
  "Marketing & Branding",
  "Tech & Software Development",
  "Design & Creative Services",
  "Finance & Legal",
  "Health & Wellness",
  "E-commerce & Retail",
  "Real Estate & Property",
  "Hospitality & F&B",
  "Education & Training",
  "Media & Content Creation",
  "Other",
];

const STAGES = [
  "Idea stage (planning)",
  "Just started (0-1 year)",
  "Early stage (1-3 years)",
  "Established (3-5 years)",
  "Scaling (5+ years)",
];

const HEARD = [
  "Personal invitation",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Friend or colleague referral",
  "Google search",
  "Other",
];

const RESONATE = [
  "I value collaboration over competition",
  "I believe in giving as much as I take",
  "I am done with surface level networking",
  "I respect and appreciate diverse cultures",
  "I am building a business with purpose beyond profit",
  "I am ready to show up consistently, not just when I need something",
];

const ATTEND = [
  "Yes, I will do my best to attend regularly",
  "Maybe, depending on the schedule and where it is",
  "No, I prefer an online community",
];



export function ApplyForm({ villages }: { villages: Village[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    submitApplication,
    {}
  );
  // Picking a city with no Village opens the panel that explains what
  // happens next, as the prototype does.
  const [village, setVillage] = useState("");

  return (
    <form action={action} className="panel">
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <h3 className="formsec">
        <Ic name="user" />
        About you
      </h3>
      <div className="formgrid">
        <label className="field">
          <span>First name</span>
          <input name="first_name" required autoComplete="given-name" />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="last_name" required autoComplete="family-name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Phone (WhatsApp)</span>
          <input name="phone" autoComplete="tel" />
        </label>
        <label className="field">
          <span>City you live in now</span>
          <input name="city" required />
        </label>
        <label className="field">
          <span>Country</span>
          <input name="country" required />
        </label>
        <label className="field">
          <span>Nationalities</span>
          <input name="nationalities" placeholder="Separate with commas" />
          <span className="hint">Up to five.</span>
        </label>
        <label className="field">
          <span>Languages you work in</span>
          <input name="languages" placeholder="Separate with commas" />
        </label>
        <label className="field full">
          <span>Countries you have lived in</span>
          <input name="lived_in" placeholder="Separate with commas" />
        </label>
        <div className="field full privacy">
          <Ic name="globe" style={{ color: "#4074AE" }} />
          <span className="muted small">
            Your nationalities, languages and the countries you have lived in
            make up your expat journey on your profile.
          </span>
        </div>
      </div>

      <h3 className="formsec">
        <Ic name="briefcase" />
        Tell us more about your business
      </h3>
      <div className="formgrid">
        <label className="field">
          <span>Business name</span>
          <input name="business_name" />
        </label>
        <label className="field">
          <span>Your role</span>
          <input name="role" placeholder="Founder, cofounder, director" />
        </label>
        <label className="field">
          <span>What industry or niche are you in?</span>
          <select name="industry" defaultValue="">
            <option value="">Choose one</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry}>{industry}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>What stage is your business at?</span>
          <select name="stage" defaultValue="">
            <option value="">Choose one</option>
            {STAGES.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label className="field full">
          <span>What type of business do you run or are you building?</span>
          <textarea name="about_business" rows={3} />
        </label>
        <label className="field full">
          <span>What is your biggest challenge in business at this moment?</span>
          <textarea name="challenge" rows={3} />
        </label>
        <label className="field full">
          <span>Website or LinkedIn</span>
          <input name="link" placeholder="studiodubois.com" />
        </label>
      </div>

      <h3 className="formsec">
        <Ic name="check" />
        Now, let us see if we are a good fit
      </h3>
      <div className="formgrid">
        <label className="field full">
          <span>Which Village would you like to join?</span>
          <select
            name="village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          >
            <option value="">Choose one</option>
            {villages.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
                {v.status === "open"
                  ? " (open now)"
                  : v.status === "launching"
                    ? " (opening soon)"
                    : " (being explored)"}
              </option>
            ))}
            <option value="none">There is no Village in my city yet</option>
          </select>
        </label>

        {village === "none" ? (
          <div className="field full novillage">
            <div className="panel" style={{ borderColor: "#CFDDEE", background: "#FBFCFE" }}>
              <h3 style={{ fontSize: 15 }}>No Village in your city yet</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                We will still read your request, and we will add your city to
                our list of suggestions. You can join the network and come to
                events online in the meantime.
              </p>
              <label className="check" style={{ marginTop: 12 }}>
                <input type="checkbox" name="offers_admin" />
                <span>
                  <b>I would be interested in helping start one</b>
                  <small>
                    A Village needs somebody local who knows people and turns
                    up. Tell us and we will talk.
                  </small>
                </span>
              </label>
            </div>
          </div>
        ) : null}

        <fieldset className="field full choiceset">
          <legend>
            Which of these statements resonate with you? Choose any that do.
          </legend>
          <div className="choicegrid">
            {RESONATE.map((line) => (
              <label className="check" key={line}>
                <input type="checkbox" name="resonate" value={line} />
                <span>
                  <b>{line}</b>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field full">
          <span>Can you come to gatherings in person?</span>
          <select name="attend" defaultValue={ATTEND[0]}>
            {ATTEND.map((answer) => (
              <option key={answer}>{answer}</option>
            ))}
          </select>
        </label>

        <label className="field full">
          <span>Why would you like to be part of ExpatPreneurs?</span>
          <textarea name="why_join" rows={4} />
          <span className="hint">
            A few sentences on what you hope to get from the community.
          </span>
        </label>

        <label className="field full">
          <span>What could you give back to the ExpatPreneurs community?</span>
          <textarea name="contribute" rows={3} />
          <span className="hint">
            Expertise, your network, mentoring time, anything.
          </span>
        </label>

        <label className="field">
          <span>How did you hear about ExpatPreneurs?</span>
          <select name="heard_about" defaultValue="">
            <option value="">Choose one</option>
            {HEARD.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Member who referred you</span>
          <input name="referrer" placeholder="Optional" />
        </label>
      </div>

      <h3 className="formsec">
        <Ic name="heart" />
        Our values
      </h3>
      <div className="stack">
        {[
          ["people", "I will put people before transactions"],
          ["contribute_value", "I will contribute as well as receive"],
          [
            "not_dating",
            "I understand this is a professional community, not a dating space",
          ],
          ["conduct", "I agree to the terms and the privacy policy"],
        ].map(([name, label]) => (
          <label className="check" key={name}>
            <input type="checkbox" name={name} required />
            <span>
              <b>{label}</b>
            </span>
          </label>
        ))}
      </div>

      <button
        className="btn btn-primary"
        type="submit"
        disabled={pending}
        style={{ marginTop: 18 }}
      >
        {pending ? "Sending" : "Send my request"}
      </button>
    </form>
  );
}
'@
Write-File "app\apply\form.tsx" $f0

$f1 = @'
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
'@
Write-File "app\apply\actions.ts" $f1

git add app/apply
git commit -m "The invitation form in four sections, with the no Village branch"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
