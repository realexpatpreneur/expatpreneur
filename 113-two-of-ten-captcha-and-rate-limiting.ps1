# 113-two-of-ten-captcha-and-rate-limiting.ps1
# Two of ten. One migration: 0041_form_rate_limit.sql.
#
# Five public forms could be sent as fast as a script can type: the
# invitation request, the contact page, the city suggestion, the
# newsletter and the sign in link. Each carried a hidden field that
# catches a simple robot, which is not the same as a limit.
#
# Rate limiting, working today, no account needed. Every send is
# counted against the address it came from, and the address is hashed
# before it is stored, so the table holds a hash and a form name and
# nothing else. Anything older than a day is deleted on the next call.
# The limits are an hour each: three invitation requests, five contact
# messages, five city suggestions, five newsletter sign ups, eight sign
# in links. A person does not reach those. A script reaches them in a
# second and is then told to wait.
#
# If the counting itself fails, the person is let through. A form that
# refuses everybody because our own table is unhappy is worse than the
# spam.
#
# Captcha, ready but off. Cloudflare Turnstile, which is free and does
# not track anybody, is wired into the three forms that carry real
# writing. With no keys it renders nothing at all and the forms behave
# exactly as they do now. To switch it on, make a Turnstile site at
# cloudflare.com, then add in Vercel:
#
#   NEXT_PUBLIC_TURNSTILE_SITE_KEY = the site key
#   TURNSTILE_SECRET_KEY = the secret
#
# There is one more setting worth adding whenever you like:
#
#   RATE_SALT = any random string
#
# It is what the addresses are hashed with. It works without it.
#
# Run the migration in Supabase:
#   supabase/migrations/0041_form_rate_limit.sql
#
#   powershell -ExecutionPolicy Bypass -File .\113-two-of-ten-captcha-and-rate-limiting.ps1

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
-- Stopping somebody sending the same form a thousand times.
--
-- No third party service and nothing kept about a person: the address a
-- request came from is hashed before it is stored, the row holds only
-- that hash and which form it was, and anything older than a day is
-- deleted on the next call.

create table form_hits (
  id         bigserial primary key,
  form       text not null,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index form_hits_lookup on form_hits(form, ip_hash, created_at desc);

alter table form_hits enable row level security;
-- No policy at all: nobody reads this table. It is written and counted
-- only through the function below, which runs as its owner.

-- Records one attempt and says how many there have been in the window.
-- The caller decides what to do with the number.
create or replace function note_form_hit(
  p_form text,
  p_ip_hash text,
  p_minutes int default 60
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  delete from form_hits where created_at < now() - interval '1 day';

  insert into form_hits (form, ip_hash) values (p_form, p_ip_hash);

  select count(*) into recent
  from form_hits
  where form = p_form
    and ip_hash = p_ip_hash
    and created_at > now() - make_interval(mins => p_minutes);

  return recent;
end;
$$;

grant execute on function note_form_hit(text, text, int) to anon, authenticated;
'@
Write-File "supabase\migrations\0041_form_rate_limit.sql" $f0

$f1 = @'
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Turnstile is Cloudflare's captcha. It is free, it does not track
// people, and most visitors never see anything. Like Stripe and Resend,
// it stays out of the way until the keys exist.
export const captchaReady = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
);

export async function captchaPassed(token: string | null): Promise<boolean> {
  if (!captchaReady) return true;
  if (!token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // If Cloudflare is unreachable, let the person through. A form that
    // refuses everybody because a third party is down is worse than the
    // spam it prevents.
    return true;
  }
}

// How many times this address has sent this form lately. The address is
// hashed before it leaves this function, so nothing identifying is
// stored.
export async function tooManyTries(
  form: string,
  limit: number,
  minutes = 60
): Promise<boolean> {
  try {
    const head = await headers();
    const ip =
      head.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      head.get("x-real-ip") ||
      "unknown";

    const hash = createHash("sha256")
      .update(ip + "|" + (process.env.RATE_SALT ?? "expatpreneurs"))
      .digest("hex");

    const supabase = await createClient();
    const { data } = await supabase.rpc("note_form_hit", {
      p_form: form,
      p_ip_hash: hash,
      p_minutes: minutes,
    });

    return typeof data === "number" && data > limit;
  } catch {
    // Counting failed, so let them through rather than block a real
    // person over our own fault.
    return false;
  }
}

export const TOO_MANY =
  "That is a lot of attempts in a short time. Please wait a little and try again.";
'@
Write-File "lib\guard.ts" $f1

$f2 = @'
"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The captcha, if there is one. With no site key this renders nothing at
// all, so the forms work exactly as they do today until Cloudflare is
// set up.
export function Captcha() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;

    const id = "cf-turnstile";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.id = id;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }

    function render() {
      const api = (window as unknown as {
        turnstile?: { render: (el: Element, o: Record<string, unknown>) => void };
      }).turnstile;
      if (api && box.current && !box.current.hasChildNodes()) {
        api.render(box.current, { sitekey: SITE_KEY, theme: "light" });
      }
    }
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={box} style={{ marginTop: 14 }} />;
}
'@
Write-File "components\captcha.tsx" $f2

$f3 = @'
"use client";

import { useActionState, useState } from "react";
import { Captcha } from "@/components/captcha";
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

      <Captcha />

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
Write-File "app\apply\form.tsx" $f3

$f4 = @'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
Write-File "app\apply\actions.ts" $f4

$f5 = @'
"use client";

import { useActionState } from "react";
import { Captcha } from "@/components/captcha";
import { sendEnquiry, type ContactState } from "./actions";

type Village = { slug: string; name: string };

export function ContactForm({
  kind,
  villages,
}: {
  kind: string;
  villages: Village[];
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendEnquiry,
    {}
  );

  const general = kind === "general";

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
      <input type="hidden" name="kind" value={kind} />

      <div className="formgrid">
        <label className="field">
          <span>Full name</span>
          <input name="full_name" required autoComplete="name" />
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>

        {general ? (
          <label className="field full">
            <span>Village</span>
            <select name="village" defaultValue="">
              <option value="">Not sure</option>
              {villages.map((village) => (
                <option key={village.slug} value={village.slug}>
                  {village.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field full">
            <span>Organisation</span>
            <input name="organisation" />
          </label>
        )}

        <label className="field full">
          <span>Message</span>
          <textarea name="message" rows={5} required />
        </label>
      </div>

      <Captcha />

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}
'@
Write-File "app\contact\form.tsx" $f5

$f6 = @'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, captchaPassed, TOO_MANY } from "@/lib/guard";

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

  // A person does not send this 6 times in an hour.
  if (await tooManyTries("contact", 5)) return { error: TOO_MANY };

  if (!(await captchaPassed(String(formData.get("cf-turnstile-response") ?? "") || null))) {
    return { error: "The check did not pass. Please try again." };
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
'@
Write-File "app\contact\actions.ts" $f6

$f7 = @'
"use client";

import { useActionState } from "react";
import { Captcha } from "@/components/captcha";
import { suggestCity, type CityState } from "./actions";

export function CitySuggestionForm({
  city = "",
  country = "",
}: {
  city?: string;
  country?: string;
}) {
  const [state, action, pending] = useActionState<CityState, FormData>(
    suggestCity,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 680 }}>
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>


      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <div className="g2">
        <label className="field">
          <span>City</span>
          <input name="city" required defaultValue={city} />
        </label>
        <label className="field">
          <span>Country</span>
          <input name="country" required defaultValue={country} />
        </label>
      </div>

      <label className="field">
        <span>Your name</span>
        <input name="name" autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" />
        <span className="hint">
          So we can tell you when the Village opens. Nothing else is sent.
        </span>
      </label>

      <label className="check">
        <input type="checkbox" name="offers_admin" />
        <span>
          <b>I would be interested in helping run it</b>
          <small>
            A Village needs someone local who knows people and turns up.
          </small>
        </span>
      </label>

      <label className="field">
        <span>Tell us about yourself</span>
        <textarea name="about" rows={3} />
      </label>

      <label className="field">
        <span>Who do you already know in that city?</span>
        <textarea name="network" rows={3} />
      </label>

      <Captcha />

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}
'@
Write-File "app\villages\suggest\form.tsx" $f7

$f8 = @'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, captchaPassed, TOO_MANY } from "@/lib/guard";

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

  // A person does not send this 6 times in an hour.
  if (await tooManyTries("suggest-city", 5)) return { error: TOO_MANY };

  if (!(await captchaPassed(String(formData.get("cf-turnstile-response") ?? "") || null))) {
    return { error: "The check did not pass. Please try again." };
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
'@
Write-File "app\villages\suggest\actions.ts" $f8

$f9 = @'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tooManyTries, TOO_MANY } from "@/lib/guard";

export type SubscribeState = { error?: string };

// The newsletter sign up. Nothing here reveals whether an address is
// already on the list.
export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  if (await tooManyTries("newsletter", 5)) return { error: TOO_MANY };

  if (String(formData.get("website") ?? "").trim()) {
    redirect("/media/subscribed");
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "An email address is needed." };

  const supabase = await createClient();

  // A duplicate is not an error the person needs to hear about.
  await supabase.from("newsletter_signups").insert({
    email,
    source: String(formData.get("source") ?? "media"),
  });

  redirect("/media/subscribed");
}
'@
Write-File "app\media\subscribe.ts" $f9

$f10 = @'
"use server";

import { headers } from "next/headers";
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
    return { error: "That did not work. Check the address and try again." };
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

  return { sent: false };
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
Write-File "app\login\actions.ts" $f10

git add app lib components supabase
git commit -m "Rate limit every public form, and wire in a captcha for when there are keys"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0041_form_rate_limit.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
