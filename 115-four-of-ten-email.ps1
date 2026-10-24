# 115-four-of-ten-email.ps1
# Four of ten. No migration.
#
# Going through the thirteen sending moments turned up one that was not
# a sending moment at all. When a Local Admin places somebody in a
# Circle, the platform makes the WhatsApp task and tells the member
# nothing. No notification, no email. That is the moment a person
# actually joins: before a Circle they are a name on a list. It now
# sends both, and it uses the template that has been sitting in the
# Global workspace unused since it was seeded.
#
# Event registration was the other one: the template existed and was
# editable, but the email went out with wording written into the code,
# so editing the template changed nothing. It goes through the template
# now, with the old wording as the fallback if anybody deletes it.
#
# supabase/setup/email-setup.md is the rest: why this is the one thing
# that genuinely needs the domain, the five steps once you have it, what
# starts sending the same hour, and how to test it properly in Resend
# rather than by staring at your inbox.
#
# The short version of the why: Resend will not send from an address you
# cannot prove you own, which is what stops everybody else sending as
# you. Domain, then DNS records, then verified, then the key.
#
#   powershell -ExecutionPolicy Bypass -File .\115-four-of-ten-email.ps1

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
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { sendTemplate, sendEmail, url } from "@/lib/email";
import { whenText } from "@/lib/events";

export type RegisterState = { error?: string; done?: string };

// A member registering for themselves. The database checks the audience,
// the tier and the Village rules again, so a refusal here is final.
export async function registerForEvent(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const eventId = String(formData.get("event_id"));
  const requiresApproval = formData.get("requires_approval") === "1";
  const isVisitor = formData.get("is_visitor") === "1";

  const waiting = formData.get("waiting_list") === "1";

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
    is_visitor: isVisitor,
    status: waiting ? "waitlist" : requiresApproval ? "pending" : "confirmed",
    note: String(formData.get("note") ?? "").trim() || null,
    dietary: String(formData.get("dietary") ?? "").trim() || null,
  });

  if (error) {
    return {
      error:
        "That registration was refused. Either the event is not open to you, or you are already on the list.",
    };
  }

  const [{ data: event }, { data: profile }] = await Promise.all([
    supabase
      .from("events")
      .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("member_records")
      .select("email, full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (waiting) {
    revalidatePath(`/events/${slug}`);
    return { done: "waiting" };
  }

  if (event && profile?.email) {
    // Through the template, so the Global team's wording is the wording
    // that goes out. The text below is only used if the template has
    // been deleted.
    await sendTemplate(
      "event_registration",
      profile.email,
      {
        title: event.title,
        when: whenText(event),
        where: event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : event.venue ?? "The venue is on the event page.",
        status: requiresApproval
          ? "Your request is with the host, who will confirm shortly."
          : "Your place is confirmed.",
        link: url(`/events/${slug}`),
      },
      {
        subject: requiresApproval
          ? `Request sent: ${event.title}`
          : `You are going: ${event.title}`,
        title: event.title,
        lines: [
          requiresApproval
            ? "Your request is with the host, who will confirm shortly."
            : "Your place is confirmed.",
          whenText(event),
          event.is_online
            ? `Online. ${event.online_url ?? "The link is on the event page."}`
            : event.venue ?? "The venue is on the event page.",
          "A reminder comes the day before and an hour before it starts.",
        ],
        action: { label: "Open the event", href: url(`/events/${slug}`) },
      }
    );
  }

  revalidatePath(`/events/${slug}`);
  return { done: requiresApproval ? "pending" : "confirmed" };
}

// A place that comes free goes to whoever has waited longest, and they are
// told rather than left to notice.
export async function offerThePlaceOn(eventId: string, slug: string) {
  const service = createAdminClient();

  const { data: event } = await service
    .from("events")
    .select("id, title, capacity, starts_at, ends_at, timezone, venue, address, is_online, online_url")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return;

  const { count: taken } = await service
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if ((taken ?? 0) >= event.capacity) return;

  const { data: next } = await service
    .from("event_registrations")
    .select("id, profile_id")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!next?.profile_id) return;

  await service
    .from("event_registrations")
    .update({ status: "confirmed" })
    .eq("id", next.id);

  await notify(
    next.profile_id,
    "event",
    `A place came free: ${event.title}`,
    "You were next on the list, and you are in.",
    `/events/${slug}`
  );

  const { data: person } = await service
    .from("profiles")
    .select("email, full_name")
    .eq("id", next.profile_id)
    .maybeSingle();

  if (person?.email) {
    await sendEmail(
      person.email,
      `A place came free: ${event.title}`,
      "You are in",
      [
        `${person.full_name.split(" ")[0]}, somebody gave up their place and you were next.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : `${event.venue ?? ""} ${event.address ?? ""}`.trim() ||
            "The venue is on the event page.",
        "If you can no longer make it, cancel so the next person gets it.",
      ],
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
  }
}

export async function cancelRegistration(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const eventId = String(formData.get("event_id"));

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  await offerThePlaceOn(eventId, slug);

  revalidatePath(`/events/${slug}`);
  return { done: "cancelled" };
}

// Anyone, on or off the platform, for a public event.
export async function registerAsGuest(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const name = String(formData.get("guest_name") ?? "").trim();
  const email = String(formData.get("guest_email") ?? "").trim();
  if (!name || !email) return { error: "Your name and email are needed." };

  const { error } = await supabase.from("event_registrations").insert({
    event_id: String(formData.get("event_id")),
    guest_name: name,
    guest_email: email,
    guest_company: String(formData.get("guest_company") ?? "").trim() || null,
    guest_city: String(formData.get("guest_city") ?? "").trim() || null,
    guest_hopes: String(formData.get("guest_hopes") ?? "").trim() || null,
    status: formData.get("requires_approval") === "1" ? "pending" : "confirmed",
  });

  if (error) {
    return {
      error:
        "That did not go through. You may already be registered with that address.",
    };
  }

  const slug = String(formData.get("slug"));
  const { data: event } = await supabase
    .from("events")
    .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
    .eq("id", String(formData.get("event_id")))
    .maybeSingle();

  if (event) {
    await sendEmail(
      email,
      `You are registered: ${event.title}`,
      event.title,
      [
        `Thank you for registering, ${name.split(" ")[0]}.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link follows nearer the time."}`
          : event.venue ?? "The venue follows nearer the time.",
        "This event is open to everyone. Most of what ExpatPreneurs does is for members, by invitation.",
      ],
      { label: "See the event", href: url(`/e/${slug}`) }
    );
  }

  redirect(`/e/${slug}?registered=1`);
}
'@
Write-File "app\events\actions.ts" $f0

$f1 = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { sendEmailToMember, sendTemplate, url } from "@/lib/email";
import { record } from "@/lib/audit";
import { notify } from "@/lib/notify";

export type MemberAdminState = { error?: string };

export async function updateMember(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const circleId = String(formData.get("circle_id") || "") || null;

  const { data: before } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      circle_id: circleId,
      status: String(formData.get("status") ?? "active"),
      plan: String(formData.get("plan") ?? "member"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await record(admin.userId, "member.updated", "profile", id, {
    circle_id: circleId,
    status: String(formData.get("status") ?? "active"),
    plan: String(formData.get("plan") ?? "member"),
  });

  // Moving someone between Circles means the WhatsApp groups change too.
  if (circleId && before?.circle_id !== circleId) {
    const { data: circle } = await supabase
      .from("circles")
      .select("name, village_id")
      .eq("id", circleId)
      .maybeSingle();

    await supabase.from("whatsapp_tasks").insert({
      village_id: circle?.village_id ?? admin.homeVillageId,
      profile_id: id,
      kind: before?.circle_id ? "move" : "add",
      group_name: circle?.name ?? "Village group",
    });

    // And the member is told, which until now they were not. This is
    // the moment somebody actually joins: before a Circle they are a
    // name in a list.
    const { data: person } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", id)
      .maybeSingle();

    await notify(
      id,
      "announcement",
      before?.circle_id ? "You have moved Circle" : "You are in a Circle",
      `${circle?.name ?? "Your Circle"} is your home base.`,
      "/my-circle"
    );

    await sendTemplate(
      "circle",
      person?.email ?? null,
      {
        name: (person?.full_name ?? "there").split(" ")[0],
        circle: circle?.name ?? "your Circle",
        link: url("/my-circle"),
      },
      {
        subject: before?.circle_id
          ? `You have moved to ${circle?.name ?? "a new Circle"}`
          : `You are in ${circle?.name ?? "a Circle"}`,
        title: circle?.name ?? "Your Circle",
        lines: [
          before?.circle_id
            ? "Your Local Admin has moved you, and the WhatsApp groups will follow within a day or so."
            : "This is your home base: up to fifty members who meet, ask and answer each other.",
          "Your Local Admin adds you to the WhatsApp group by hand, so give it a day.",
        ],
        action: { label: "Open your Circle", href: url("/my-circle") },
      },
      { profileId: id, kind: "announcements" }
    );
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${id}?done=1`);
}

export async function saveCircle(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const row = {
    name: String(formData.get("name") ?? "").trim(),
    whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "preparing"),
  };

  if (!row.name) return { error: "A Circle needs a name." };

  if (id) {
    const { error } = await supabase.from("circles").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const villageId =
      String(formData.get("village_id") ?? "") ||
      admin.homeVillageId ||
      admin.villageIds[0];
    const { error } = await supabase
      .from("circles")
      .insert({ ...row, village_id: villageId });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/circles");
  redirect("/admin/circles?done=1");
}

export async function completeWhatsappTask(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_tasks")
    .update({ done_at: new Date().toISOString(), done_by: admin.userId })
    .eq("id", String(formData.get("task_id")));

  if (error) return { error: error.message };

  revalidatePath("/admin/whatsapp");
  return {};
}

export async function sendAnnouncement(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A title and the message are needed." };

  const { error } = await supabase.from("announcements").insert({
    village_id: admin.homeVillageId ?? admin.villageIds[0] ?? null,
    author_id: admin.userId,
    audience: String(formData.get("audience") ?? "village"),
    title,
    body,
    sent_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Everyone active in the Village hears it once, on the platform and by
  // email.
  const villageId = admin.homeVillageId ?? admin.villageIds[0] ?? null;
  const { data: members } = villageId
    ? await supabase
        .from("member_records")
        .select("id, email, full_name")
        .eq("village_id", villageId)
        .eq("status", "active")
    : { data: [] };

  for (const member of members ?? []) {
    await notify(member.id, "announcement", title, body.slice(0, 120), "/home");
    await sendEmailToMember(
      member.id,
      "announcements",
      member.email,
      title,
      title,
      [body],
      { label: "Open the platform", href: url("/home") }
    );
  }

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements?done=1");
}
'@
Write-File "app\admin\members\actions.ts" $f1

$f2 = @'
# Switching email on

Thirteen moments in the platform send an email. All of them are built
and all of them are silent, because there is no key. Nothing fails; the
action completes and the person is simply not told.

## Why this one really does need the domain

Resend will not send from an address you cannot prove you own. That is
not Resend being awkward, it is what stops everybody else sending as
you. So the order is: buy the domain, point it at Vercel, verify it in
Resend, then add the key.

Until then, every one of the thirteen is skipped, and the platform
still works. The two most visible gaps while you wait: somebody whose
invitation is approved is not told, and a business enquiry reaches
nobody. If you go live before email, a person has to do both by hand.

## The steps, once you have the domain

1. Resend, add your domain. It gives you three DNS records, an SPF, a
   DKIM and usually a return path.
2. Put those records wherever the domain's DNS lives. If the domain is
   on Vercel, that is Vercel, Domains, your domain, DNS records.
3. Wait for Resend to say verified. Usually minutes, sometimes hours.
4. Resend, API keys, create one with sending permission.
5. In Vercel, Settings, Environment Variables:

       RESEND_API_KEY   re_...
       EMAIL_FROM       ExpatPreneurs <hello@yourdomain.com>
       NEXT_PUBLIC_SITE_URL   https://yourdomain.com

The address in EMAIL_FROM has to be at the domain you verified.

## What starts sending, the same hour

An invitation request received, approved, declined or waitlisted.
Being placed in a Circle. A reply to your Ask or Offer. A new message.
An event registration, the reminder the day before, the hour before,
and the thank you afterwards. A business enquiry. A course sale, to
both sides. A member care note from a Local Admin. Anything sent from
the Global emails page. The weekly digest.

The reminders are already scheduled hourly and have been running and
finding nothing to do, so they start working by themselves.

## Where the wording lives

Global team, Emails. Eight templates, each editable, each with a
preview. The platform uses the template if there is one and falls back
to wording written into the code if somebody deletes it, so an email
always goes.

Two of the eight were seeded and never actually used. Event
registration now uses its template, and so does being placed in a
Circle. That second one was not only unused, it was not sent at all:
somebody could be placed in a Circle and never hear about it.

## Testing before you trust it

Resend's dashboard shows every send, whether it landed, and what
bounced. Approve a test invitation to yourself first, then look there
rather than only in your inbox.
'@
Write-File "supabase\setup\email-setup.md" $f2

git add app supabase/setup/email-setup.md
git commit -m "Tell a member when they are placed in a Circle, and use the templates that exist"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
