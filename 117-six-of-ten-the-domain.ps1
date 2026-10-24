# 117-six-of-ten-the-domain.ps1
# Six of ten. No migration.
#
# The address was written into six files, each with the same fallback,
# which is six chances to miss one on the day it changes. It is now in
# one file, lib/site.ts, and everything reads it from there.
#
# Two things the domain needs that did not exist at all.
#
# A link to this site, pasted into WhatsApp or LinkedIn, showed a bare
# address. No name, no description, nothing. For a network that will
# spread mostly by somebody sending somebody else a link, that is the
# first impression and it was blank. The site now describes itself
# properly when shared.
#
# And there was no sitemap and no robots file, so a search engine had no
# way to know what is here and no instruction about what to leave alone.
# Both exist now. The sitemap is built when asked for, so a new Village
# appears in it the day it is created, and the robots file keeps the
# member space and the workspaces out of any index.
#
# supabase/setup/domain-switch.md is the order to do it in. The step
# people miss is the sixth: Supabase has its own idea of the site
# address, and sign in links go wherever that says. Miss it and every
# sign in link sends people back to the vercel.app address.
#
#   powershell -ExecutionPolicy Bypass -File .\117-six-of-ten-the-domain.ps1

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
// The address of the site, in one place.
//
// It was written into six files, each with the same fallback. That is
// six chances to miss one on the day the domain changes.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app"
).replace(/\/$/, "");

// A full address for a path, for emails, shared links and anywhere else
// that leaves the browser.
export const siteLink = (path: string) =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

// What the site is called and what it says about itself, used in the
// page title, in link previews and in the sitemap.
export const siteName = "ExpatPreneurs Global";
export const siteDescription =
  "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.";
'@
Write-File "lib\site.ts" $f0

$f1 = @'
import { siteUrl } from "@/lib/site";
// Email goes out through Resend, called over plain HTTP so there is no extra
// dependency. Until the key is set, nothing is sent and nothing breaks.

export const emailReady = Boolean(process.env.RESEND_API_KEY);

const from = process.env.EMAIL_FROM ?? "ExpatPreneurs <hello@expatpreneurs.com>";
function wrap(
  title: string,
  lines: string[],
  action?: { label: string; href: string },
  forMember = false
) {
  const body = lines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3b4650">${line}</p>`
    )
    .join("");

  const button = action
    ? `<p style="margin:22px 0 0"><a href="${action.href}" style="display:inline-block;background:#0f1419;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px">${action.label}</a></p>`
    : "";

  const footer = forMember
    ? `<br /><a href="${siteUrl}/settings" style="color:#6b7683">Choose what reaches your inbox</a>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Inter,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e6ea;border-radius:12px;padding:28px">
    <p style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#0f1419">ExpatPreneurs</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;letter-spacing:-0.02em;color:#0f1419">${title}</h1>
    ${body}${button}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b7683">
    ExpatPreneurs Global. <a href="${siteUrl}" style="color:#6b7683">${siteUrl.replace("https://", "")}</a>${footer}
  </p>
</body></html>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  title: string,
  lines: string[],
  action?: { label: string; href: string },
  forMember = false
) {
  if (!emailReady) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: wrap(title, lines, action, forMember),
      }),
    });
  } catch {
    // An email that does not go out must never break what caused it.
  }
}

export const url = (path: string) => `${siteUrl}${path}`;

// Sending to a member rather than to an address: the member decides which
// of these they want. Anything with no preference set goes out, because
// everything is on until someone turns it off.
export async function sendEmailToMember(
  profileId: string,
  kind: "messages" | "replies" | "connections" | "events" | "announcements" | "renewal",
  to: string | null,
  subject: string,
  title: string,
  lines: string[],
  action?: { label: string; href: string }
) {
  if (!emailReady || !to) return;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const service = createAdminClient();
    const { data: wanted } = await service.rpc("wants_email", {
      who: profileId,
      what: kind,
    });
    if (wanted === false) return;
  } catch {
    // If the check itself fails, the message still goes.
  }

  // Anything sent to a member carries the line about choosing what reaches
  // them, which is both decent and, once the domain is live, required.
  await sendEmail(to, subject, title, lines, action, true);
}


// ---------------------------------------------------------- templates

// The eight transactional emails are rows rather than code, so the Global
// team can reword one at /global/emails. If a template is missing or
// switched off, the caller's own wording is used instead.
export async function sendTemplate(
  key: string,
  to: string | null,
  values: Record<string, string>,
  fallback?: { subject: string; title: string; lines: string[]; action?: { label: string; href: string } },
  forMember?: { profileId: string; kind: Parameters<typeof sendEmailToMember>[1] }
) {
  if (!emailReady || !to) return;

  let template: {
    subject: string;
    body: string;
    button_label: string | null;
    button_path: string | null;
  } | null = null;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data } = await createAdminClient()
      .from("email_templates")
      .select("subject, body, button_label, button_path")
      .eq("key", key)
      .eq("active", true)
      .maybeSingle();
    template = data;
  } catch {
    // The database is not reachable; fall back to the wording in code.
  }

  const fill = (text: string) =>
    Object.entries(values).reduce(
      (out, [name, value]) => out.split(`{${name}}`).join(value ?? ""),
      text
    );

  const subject = template ? fill(template.subject) : fallback?.subject ?? "";
  const lines = template
    ? fill(template.body).split("\n").filter((line) => line.trim())
    : fallback?.lines ?? [];
  const action = template
    ? template.button_label
      ? { label: template.button_label, href: url(template.button_path ?? "/") }
      : undefined
    : fallback?.action;

  if (!subject || lines.length === 0) return;

  if (forMember) {
    await sendEmailToMember(
      forMember.profileId,
      forMember.kind,
      to,
      subject,
      template ? subject : fallback?.title ?? subject,
      lines,
      action
    );
    return;
  }

  await sendEmail(to, subject, template ? subject : fallback?.title ?? subject, lines, action);
}
'@
Write-File "lib\email.ts" $f1

$f2 = @'
import Stripe from "stripe";
import { siteUrl } from "@/lib/site";

// Payments stay switched off until the keys are set, so the pages can say
// so plainly instead of failing.
export const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

export const membershipPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID ?? "";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return new Stripe(key);
}

// Kept exported here because the checkout pages import it from this file.
export { siteUrl };
'@
Write-File "lib\stripe.ts" $f2

$f3 = @'
import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteName, siteDescription } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  // Every page's own title and description hang off this one.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s`,
  },
  description: siteDescription,
  // What a link looks like when somebody drops it into WhatsApp or
  // LinkedIn, which is how most people will first see this.
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
'@
Write-File "app\layout.tsx" $f3

$f4 = @'
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// The member space and the workspaces are behind a sign in, so a search
// engine could not read them anyway. Saying so keeps them out of the
// index if a link ever leaks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/home",
          "/my-village",
          "/my-circle",
          "/directory",
          "/messages",
          "/notifications",
          "/settings",
          "/me",
          "/admin",
          "/global",
          "/lead",
          "/educator",
          "/re-enrol",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
'@
Write-File "app\robots.ts" $f4

$f5 = @'
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// The public pages, and the Villages, articles and events that exist
// today. Built when asked for, so a new Village appears in it the day
// it is created.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = [
    "",
    "/discover",
    "/how-it-works",
    "/membership",
    "/villages",
    "/villages/suggest",
    "/events",
    "/businesses",
    "/learning",
    "/media",
    "/watch",
    "/members",
    "/contact",
    "/apply",
    "/login",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient();
    const [{ data: villages }, { data: articles }] = await Promise.all([
      supabase.from("villages").select("slug, updated_at"),
      supabase
        .from("articles")
        .select("slug, published_at")
        .eq("status", "published")
        .eq("member_only", false),
    ]);

    return [
      ...fixed,
      ...(villages ?? []).map((v) => ({
        url: `${siteUrl}/villages/${v.slug}`,
        lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...(articles ?? []).map((a) => ({
        url: `${siteUrl}/media/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // If the database is unreachable, the fixed pages are still a
    // sitemap.
    return fixed;
  }
}
'@
Write-File "app\sitemap.ts" $f5

$f6 = @'
import { PageHead } from "@/components/workspace-shell";
import { siteUrl } from "@/lib/site";
import { Stat, Table, SecHead } from "@/components/admin-bits";
import { Av } from "@/components/bits";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { ImportForm, RemindButton, DeadlineForm, CloseOutButton } from "./forms";

export const metadata = { title: "Re-enrolment, Local Admin" };

const LABEL: Record<string, string> = {
  invited: "Invited, not yet",
  reminded: "Reminded",
  re_enrolled: "Re-enrolled",
  declined: "Stepping away",
  removed: "To remove",
};

export default async function ReEnrolmentPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageId = admin.villageIds[0] ?? null;

  const [{ data: village }, { data: people }] = await Promise.all([
    villageId
      ? supabase
          .from("villages")
          .select("id, name, reenrol_deadline")
          .eq("id", villageId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    villageId
      ? supabase
          .from("founding_invites")
          .select("id, full_name, email, phone, status, last_contact, token")
          .eq("village_id", villageId)
          .order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

  const rows = people ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const site = siteUrl;

  return (
    <>
      <PageHead
        title="Re-enrolment"
        sub={`Bringing the current ${village?.name ?? "Village"} WhatsApp members onto the platform.`}
      />

      <div className="g3 g4">
        <Stat label="On the list" value={rows.length} note="From the WhatsApp group" />
        <Stat label="Re-enrolled" value={count("re_enrolled")} note="They have an account" />
        <Stat
          label="Still waiting"
          value={count("invited") + count("reminded")}
          note="Invited, not yet through"
        />
        <Stat label="Stepping away" value={count("declined")} note="They told us" />
      </div>

      <div className="gside" style={{ marginTop: 22 }}>
        <div className="stack">
          <div className="panel">
            <SecHead title="The list" />
            {rows.length === 0 ? (
              <p className="muted small">
                Nobody on it yet. Paste the WhatsApp list beside this.
              </p>
            ) : (
              <Table head={["Member", "Status", "Last contact", "", ""]}>
                {rows.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Av name={person.full_name} className="av-sm" />
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">
                            {person.email ?? person.phone ?? "No contact yet"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          person.status === "re_enrolled"
                            ? "chip-mint"
                            : person.status === "declined" || person.status === "removed"
                              ? ""
                              : "chip-sun"
                        }`}
                      >
                        {LABEL[person.status] ?? person.status}
                      </span>
                    </td>
                    <td className="hide-m">
                      {person.last_contact ? timeAgo(person.last_contact) : "Not yet"}
                    </td>
                    <td>
                      {person.status === "re_enrolled" ? null : (
                        <RemindButton id={person.id} />
                      )}
                    </td>
                    <td>
                      {person.status === "re_enrolled" ? null : (
                        <span className="muted small" style={{ wordBreak: "break-all" }}>
                          {site}/re-enrol/{person.token}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>After the deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              People who did not re-enrol become tasks to remove from the
              WhatsApp group. Nobody is removed automatically, because the
              last thing you want is a machine cutting off a member who was
              simply on holiday.
            </p>
            {villageId ? <CloseOutButton villageId={villageId} /> : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Add people</h3>
            {villageId ? <ImportForm villageId={villageId} /> : null}
          </div>

          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              {village?.reenrol_deadline
                ? `Currently ${new Date(village.reenrol_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                : "None set."}
            </p>
            {villageId ? (
              <DeadlineForm
                villageId={villageId}
                deadline={village?.reenrol_deadline ?? null}
              />
            ) : null}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>How the link works</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Each person has their own address. Send it by WhatsApp or email.
              It opens a page with their details already filled in, where they
              confirm, set a password and keep their founding member badge, or
              say it is not for them.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
'@
Write-File "app\admin\re-enrolment\page.tsx" $f6

$f7 = @'
"use server";

import { revalidatePath } from "next/cache";
import { siteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/access";
import { sendEmail, sendTemplate, url } from "@/lib/email";

export type DecisionState = { error?: string };

async function loadApplication(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("That request could not be read.");
  return data;
}

// Approving does four things: it creates the account and sends the
// invitation email, it creates the member profile, it places them in a
// Circle, and it leaves a WhatsApp task so the groups stay in step.
export async function approveApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const circleId = String(formData.get("circle_id") || "") || null;

  const admin = await requireAdmin();
  const application = await loadApplication(id);

  if (
    !admin.isGlobal &&
    application.village_id &&
    !admin.villageIds.includes(application.village_id)
  ) {
    return { error: "That request belongs to another Village." };
  }
  if (!application.village_id) {
    return { error: "Choose a Village for this person before approving." };
  }

  const service = createAdminClient();
  const site = siteUrl;

  const { data: invited, error: inviteError } =
    await service.auth.admin.inviteUserByEmail(application.email, {
      redirectTo: `${site}/auth/callback?next=/home`,
    });

  let userId = invited?.user?.id;

  if (inviteError) {
    // Already has an account, which happens when someone applies twice.
    const { data: list } = await service.auth.admin.listUsers();
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === String(application.email).toLowerCase()
    );
    if (!existing) return { error: inviteError.message };
    userId = existing.id;
  }

  if (!userId) return { error: "The account could not be created." };

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: userId,
      full_name: application.full_name,
      email: application.email,
      phone: application.phone,
      village_id: application.village_id,
      circle_id: circleId,
      status: "onboarding",
      plan: "member",
      industry: application.industry,
      business_name: application.business_name,
      nationalities: application.nationalities ?? [],
      languages: application.languages ?? [],
      joined_on: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "id" }
  );
  if (profileError) return { error: profileError.message };

  await service
    .from("applications")
    .update({
      status: "approved",
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
      profile_id: userId,
    })
    .eq("id", id);

  if (circleId) {
    const { data: circle } = await service
      .from("circles")
      .select("name")
      .eq("id", circleId)
      .maybeSingle();
    await service.from("whatsapp_tasks").insert({
      village_id: application.village_id,
      profile_id: userId,
      kind: "add",
      group_name: circle?.name ?? "Village group",
    });
  }

  // The template wants the Village and the names of its Local Admins.
  const { data: village } = application.village_id
    ? await service
        .from("villages")
        .select("name")
        .eq("id", application.village_id)
        .maybeSingle()
    : { data: null };

  const villageName = village?.name ?? null;

  const { data: adminRoles } = application.village_id
    ? await service
        .from("member_roles")
        .select("profile_id")
        .eq("role", "local_admin")
        .eq("scope_id", application.village_id)
        .is("ended_at", null)
    : { data: [] };

  const { data: adminPeople } = (adminRoles ?? []).length
    ? await service
        .from("profiles")
        .select("full_name")
        .in("id", (adminRoles ?? []).map((r) => r.profile_id))
    : { data: [] };

  const adminNames = (adminPeople ?? [])
    .map((p) => p.full_name.split(" ")[0])
    .join(" and ");

  await service.from("audit_log").insert({
    actor_id: admin.userId,
    action: "application.approved",
    entity: "applications",
    entity_id: id,
    meta: { profile_id: userId, circle_id: circleId },
  });

  await sendTemplate(
    "approved",
    application.email,
    {
      first_name: String(application.full_name).split(" ")[0],
      village: villageName ?? "your",
      local_admins: adminNames || "Your Local Admins",
    },
    {
      subject: "You are in",
      title: "Welcome to ExpatPreneurs",
      lines: [
        `Your request has been approved, ${String(application.full_name).split(" ")[0]}.`,
        "A separate email carries the link that signs you in. Open it, finish your profile, and your Circle can find you.",
        "If it has not arrived, look in spam before writing to us.",
      ],
      action: { label: "Go to the platform", href: url("/login") },
    }
  );

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=approved`);
}

export async function waitlistApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "");
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .update({ status: "waitlisted", local_note: note, reviewed_by: admin.userId })
    .eq("id", id)
    .select("full_name, email, village_id")
    .maybeSingle();
  if (error) return { error: error.message };

  if (application) {
    const { data: village } = application.village_id
      ? await supabase
          .from("villages")
          .select("name")
          .eq("id", application.village_id)
          .maybeSingle()
      : { data: null };

    await sendTemplate(
      "waitlisted",
      application.email,
      {
        first_name: String(application.full_name).split(" ")[0],
        village: village?.name ?? "your",
      },
      {
        subject: "Your request, and where it stands",
        title: "Not yet, but not no",
        lines: [
          `Thank you for asking, ${String(application.full_name).split(" ")[0]}.`,
          "Your Village is at capacity for now, so your request is on the list rather than declined. When the next Circle opens, we come back to this list first.",
        ],
        action: { label: "See the Villages", href: url("/villages") },
      }
    );
  }

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=waitlisted`);
}

export async function declineApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  if (!reason.trim()) {
    return { error: "A reason is needed, so the decision can be reviewed." };
  }

  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .update({
      status: "declined",
      decline_reason: reason,
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("full_name, email")
    .maybeSingle();
  if (error) return { error: error.message };

  // The applicant is told the decision, never the reason.
  if (application) {
    await sendTemplate(
      "declined",
      application.email,
      { first_name: String(application.full_name).split(" ")[0] },
      {
        subject: "About your request",
        title: "Not this time",
        lines: [
          `Thank you for asking, ${String(application.full_name).split(" ")[0]}.`,
          "We are not able to offer you a place at the moment. That is a decision about fit and timing, not about your business.",
          "You are welcome to ask again in future, and the public events are open to you meanwhile.",
        ],
      }
    );
  }

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=declined`);
}
'@
Write-File "app\admin\applications\[id]\actions.ts" $f7

$f8 = @'
import { DualPage } from "@/components/dual-page";
import { siteUrl } from "@/lib/site";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

export const metadata = { title: "Share, ExpatPreneurs Global" };

// Sharing sends people to the ExpatPreneurs page rather than to YouTube,
// so they land inside the feed rather than beside it.
export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: media } = item
    ? await supabase
        .from("media_items")
        .select("slug, title, kind")
        .eq("slug", item)
        .maybeSingle()
    : { data: null };

  const site = siteUrl;
  const link = media ? `${site}/watch/${media.slug}` : `${site}/watch`;
  const title = media?.title ?? "Watch and Listen";

  return (
    <DualPage member={Boolean(member)} nav="/watch/share" active="/watch/share">
        <section className="sec">
          <div className="panel" style={{ maxWidth: 520 }}>
            <h2>Share</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              {title}
            </p>

            <label className="field" style={{ marginTop: 14 }}>
              <span>Link</span>
              <input value={link} readOnly />
            </label>

            <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${link}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="btn btn-ghost"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="btn btn-ghost"
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(link)}`}
              >
                Email
              </a>
            </div>

            <p style={{ marginTop: 16 }}>
              <Link
                className="btn btn-primary"
                href={media ? `/watch/${media.slug}` : "/watch"}
              >
                Done
              </Link>
            </p>
          </div>
        </section>
      </DualPage>
  );
}
'@
Write-File "app\watch\share\page.tsx" $f8

$f9 = @'
"use server";

import { revalidatePath } from "next/cache";
import { siteLink } from "@/lib/site";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";
import {
  recordingReady,
  startRecording,
  startStreaming,
  stopEgress,
} from "@/lib/egress";

export type LiveState = { error?: string; done?: string };

// A member puts themselves at the door. The lobby decides whether that
// means waiting or walking in.
export async function knockOnDoor(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/live/${slug}`);

  const sessionId = String(formData.get("session_id"));
  const lobby = formData.get("lobby") === "1";

  const { error } = await supabase.from("session_participants").insert({
    session_id: sessionId,
    profile_id: user.id,
    state: lobby ? "waiting" : "admitted",
    joined_at: lobby ? null : new Date().toISOString(),
  });

  if (error) {
    return {
      error:
        "That room is not open to you, or you are already at the door.",
    };
  }

  revalidatePath(`/live/${slug}`);
  return { done: lobby ? "waiting" : "admitted" };
}

export async function leaveRoom(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/live/${slug}`);

  await supabase
    .from("session_participants")
    .update({ state: "left", left_at: new Date().toISOString() })
    .eq("session_id", String(formData.get("session_id")))
    .eq("profile_id", user.id);

  revalidatePath(`/live/${slug}`);
  return { done: "left" };
}

// Host powers. The database checks again that the person pressing this
// really is a host of this room.
export async function decideOnParticipant(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const slug = String(formData.get("slug"));
  const decision = String(formData.get("decision"));

  const patch =
    decision === "admit"
      ? { state: "admitted", joined_at: new Date().toISOString() }
      : decision === "remove"
        ? { state: "removed", left_at: new Date().toISOString() }
        : { state: "waiting" };

  const { error } = await supabase
    .from("session_participants")
    .update(patch)
    .eq("id", String(formData.get("participant_id")));

  if (error) return { error: "That was refused. Only a host can do this." };

  revalidatePath(`/live/${slug}`);
  return {};
}

export async function setParticipantRole(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const slug = String(formData.get("slug"));

  const { error } = await supabase
    .from("session_participants")
    .update({ role: String(formData.get("role")) })
    .eq("id", String(formData.get("participant_id")));

  if (error) return { error: "That was refused. Only a host can do this." };

  revalidatePath(`/live/${slug}`);
  return {};
}

// Calling a room off. The people at the door and in it are told, which is
// the whole point of doing it here rather than just deleting the row.
export async function cancelSession(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  const session = await hostOf(sessionId);
  if (!session) return { error: "Only a host can call this off." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "cancelled", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await record(user?.id ?? null, "session.cancelled", "live_session", sessionId, {
    title: session.title,
  });

  const service = createAdminClient();
  const { data: people } = await service
    .from("session_participants")
    .select("profile_id")
    .eq("session_id", sessionId)
    .in("state", ["waiting", "admitted", "invited"]);

  for (const person of people ?? []) {
    if (!person.profile_id) continue;
    await notify(
      person.profile_id,
      "event",
      `Called off: ${session.title}`,
      "The host has called this room off.",
      "/live"
    );
  }

  revalidatePath(`/live/${slug}`);
  redirect("/live?cancelled=1");
}

export async function setSessionStatus(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));

  const patch: Record<string, unknown> = { status };
  if (status === "live") patch.started_at = new Date().toISOString();
  if (status === "ended") patch.ended_at = new Date().toISOString();

  const { error } = await supabase
    .from("live_sessions")
    .update(patch)
    .eq("id", String(formData.get("session_id")));

  if (error) return { error: "That was refused. Only a host can do this." };

  revalidatePath(`/live/${slug}`);
  return {};
}

// ------------------------------------------------------- recording and streaming


async function hostOf(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { data: role } = await supabase.rpc("session_role_for", { s: session });
  if (!["host", "cohost"].includes((role as string) ?? "")) return null;

  return session;
}

export async function beginRecording(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  if (!recordingReady) {
    return { error: "Recording is not switched on yet." };
  }

  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  const session = await hostOf(sessionId);
  if (!session) return { error: "Only a host can record this room." };
  if (!session.provider_room) return { error: "Open the room first." };

  try {
    const egressId = await startRecording(session.provider_room, sessionId);
    const service = createAdminClient();
    await service.from("session_recordings").insert({
      session_id: sessionId,
      provider_ref: egressId,
      status: "recording",
    });
  } catch {
    return { error: "LiveKit refused to start the recording." };
  }

  revalidatePath(`/live/${slug}`);
  return { done: "recording" };
}

export async function endRecording(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can stop the recording." };
  }

  const service = createAdminClient();
  const { data: recording } = await service
    .from("session_recordings")
    .select("id, provider_ref")
    .eq("session_id", sessionId)
    .eq("status", "recording")
    .maybeSingle();

  if (!recording?.provider_ref) return { error: "Nothing is recording." };

  try {
    await stopEgress(recording.provider_ref);
    await service
      .from("session_recordings")
      .update({ status: "processing" })
      .eq("id", recording.id);
  } catch {
    return { error: "LiveKit refused to stop the recording." };
  }

  revalidatePath(`/live/${slug}`);
  return { done: "stopped" };
}

export async function addStreamTarget(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can add a destination." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("stream_targets").insert({
    session_id: sessionId,
    platform: String(formData.get("platform") ?? "custom"),
    rtmp_url: String(formData.get("rtmp_url") ?? "").trim(),
    stream_key: String(formData.get("stream_key") ?? "").trim(),
  });

  if (error) return { error: "That destination could not be saved." };

  revalidatePath(`/live/${slug}`);
  return {};
}

export async function beginStreaming(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  const session = await hostOf(sessionId);
  if (!session) return { error: "Only a host can stream this room." };
  if (!session.provider_room) return { error: "Open the room first." };

  const supabase = await createClient();
  const { data: targets } = await supabase
    .from("stream_targets")
    .select("id, rtmp_url, stream_key")
    .eq("session_id", sessionId)
    .in("status", ["idle", "failed", "ended"]);

  if (!targets?.length) return { error: "Add a destination first." };

  const urls = targets.map(
    (t) => `${t.rtmp_url.replace(/\/$/, "")}/${t.stream_key}`
  );

  try {
    const egressId = await startStreaming(session.provider_room, urls);
    await supabase
      .from("stream_targets")
      .update({
        status: "live",
        started_at: new Date().toISOString(),
        error: egressId,
      })
      .in(
        "id",
        targets.map((t) => t.id)
      );
  } catch {
    return { error: "LiveKit refused to start the stream." };
  }

  revalidatePath(`/live/${slug}`);
  return { done: "streaming" };
}

export async function endStreaming(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can stop the stream." };
  }

  const supabase = await createClient();
  const { data: targets } = await supabase
    .from("stream_targets")
    .select("id, error")
    .eq("session_id", sessionId)
    .eq("status", "live");

  const egressId = targets?.[0]?.error;
  if (egressId) {
    try {
      await stopEgress(egressId);
    } catch {
      // It may have stopped on its own; the rows are tidied either way.
    }
  }

  await supabase
    .from("stream_targets")
    .update({ status: "ended", ended_at: new Date().toISOString(), error: null })
    .eq("session_id", sessionId)
    .eq("status", "live");

  revalidatePath(`/live/${slug}`);
  return { done: "stopped" };
}

// A finished recording becomes something members can watch, carrying the
// same audience it was recorded for.
export async function publishRecording(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  const session = await hostOf(sessionId);
  if (!session) return { error: "Only a host can publish this." };

  const service = createAdminClient();
  const { data: recording } = await service
    .from("session_recordings")
    .select("id, url, duration, media_item_id")
    .eq("id", String(formData.get("recording_id")))
    .maybeSingle();

  if (!recording?.url) return { error: "That recording is not ready." };
  if (recording.media_item_id) return { error: "It is already published." };

  const { data: media, error } = await service
    .from("media_items")
    .insert({
      kind: "video",
      slug: `${slug}-recording-${Date.now().toString(36)}`,
      title: session.title,
      summary: session.purpose,
      external_url: siteLink(`/api/live/recording/${recording.id}`),
      duration: recording.duration,
      member_only: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: "That could not be published." };

  await service
    .from("session_recordings")
    .update({ media_item_id: media?.id })
    .eq("id", recording.id);

  revalidatePath(`/live/${slug}`);
  return { done: "published" };
}

// ------------------------------------------------------------------ breakouts

// A Circle of fifty splitting into tables is how these rooms actually run.
export async function createBreakouts(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can set up breakouts." };
  }

  const howMany = Math.min(12, Math.max(2, Number(formData.get("rooms") ?? 3)));
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("breakout_rooms")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);

  const from = (existing?.[0]?.position ?? 0) + 1;

  const rows = Array.from({ length: howMany }, (_, i) => ({
    session_id: sessionId,
    position: from + i,
    name: `Table ${from + i}`,
  }));

  const { error } = await supabase.from("breakout_rooms").insert(rows);
  if (error) return { error: "Those tables could not be made." };

  revalidatePath(`/live/${slug}`);
  return {};
}

// Deal everyone in the room out across the tables, in turn.
export async function shuffleBreakouts(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can do this." };
  }

  const supabase = await createClient();

  const [{ data: rooms }, { data: people }] = await Promise.all([
    supabase
      .from("breakout_rooms")
      .select("id")
      .eq("session_id", sessionId)
      .order("position"),
    supabase
      .from("session_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("state", "admitted"),
  ]);

  if (!rooms?.length) return { error: "Make some tables first." };
  if (!people?.length) return { error: "Nobody is in the room yet." };

  for (const room of rooms) {
    await supabase.from("breakout_assignments").delete().eq("room_id", room.id);
  }

  const assignments = people.map((person, i) => ({
    room_id: rooms[i % rooms.length].id,
    participant_id: person.id,
  }));

  const { error } = await supabase.from("breakout_assignments").insert(assignments);
  if (error) return { error: "Those places could not be saved." };

  revalidatePath(`/live/${slug}`);
  return {};
}

export async function setBreakoutsOpen(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can do this." };
  }

  const open = formData.get("open") === "1";
  const supabase = await createClient();

  const { error } = await supabase
    .from("breakout_rooms")
    .update({ open })
    .eq("session_id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/live/${slug}`);
  return { done: open ? "opened" : "closed" };
}

export async function renameBreakout(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can do this." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("breakout_rooms")
    .update({
      name: String(formData.get("name") ?? "").trim() || "Table",
      topic: String(formData.get("topic") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("room_id")));

  if (error) return { error: error.message };

  revalidatePath(`/live/${slug}`);
  return {};
}

// ------------------------------------------------------------------ questions

export async function askQuestion(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/live/${slug}`);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write the question first." };

  const { error } = await supabase.from("session_questions").insert({
    session_id: String(formData.get("session_id")),
    profile_id: user.id,
    body,
  });

  if (error) return { error: "That question could not be asked." };

  revalidatePath(`/live/${slug}`);
  return { done: "asked" };
}

export async function answerQuestion(
  _prev: LiveState,
  formData: FormData
): Promise<LiveState> {
  const sessionId = String(formData.get("session_id"));
  const slug = String(formData.get("slug"));
  if (!(await hostOf(sessionId))) {
    return { error: "Only a host can do this." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("session_questions")
    .update({ answered_at: new Date().toISOString() })
    .eq("id", String(formData.get("question_id")));

  if (error) return { error: error.message };

  revalidatePath(`/live/${slug}`);
  return {};
}
'@
Write-File "app\live\actions.ts" $f9

$f10 = @'
# Moving to the real domain

Nothing in the code has the address written into it. It reads one
setting, NEXT_PUBLIC_SITE_URL, from one file, lib/site.ts. Change that
setting and everything that leaves the site follows: the links in
emails, the re-enrolment links you paste into WhatsApp, the sharing
links, what Stripe sends people back to, the sitemap and what a link
looks like when somebody drops it into WhatsApp or LinkedIn.

## The order to do it in

1. Buy the domain.
2. Vercel, the project, Settings, Domains, add it. Vercel gives you the
   records to point at it. If you bought the domain at Vercel, it does
   this itself.
3. Wait for it to say valid, then open the site on the new address.
4. Vercel, Settings, Environment Variables, set:

       NEXT_PUBLIC_SITE_URL = https://yourdomain.com

   No trailing slash. It is trimmed either way, but keep it clean.
5. Redeploy. The setting is read at build time, so it does not change
   until you do.
6. Supabase, Authentication, URL Configuration. Set the site URL to the
   same address and add it to the redirect list. Sign in links go to
   whatever is set there, so if you miss this step every sign in link
   sends people to the vercel.app address.
7. Stripe, if it is connected by then: the checkout return addresses
   come from the same setting, so there is nothing to change in Stripe
   itself.
8. Resend: verify the domain, then set EMAIL_FROM to an address at it.
   See email-setup.md.

## What to check afterwards

- Sign out, request a sign in link, and look at where the link points.
  This is the one that catches step 6.
- Open the site's address with /sitemap.xml on the end. It should list
  the public pages, every Village and every public article.
- Paste the home page address into a WhatsApp message to yourself. It
  should show the name and the description rather than a bare link.
- Run the audit against the new address:

      node audit.mjs --base https://yourdomain.com

## The old address

Vercel keeps expatpreneur.vercel.app working and will redirect it to
the domain once the domain is the primary one. Nothing breaks for
anybody holding an old link.
'@
Write-File "supabase\setup\domain-switch.md" $f10

git add app lib supabase/setup/domain-switch.md
git commit -m "One place for the address, link previews, a sitemap and a robots file"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
