# 111-one-of-ten-the-scheduled-jobs.ps1
# First of the ten. No migration.
#
# Two jobs have existed for weeks and neither has ever run, because
# nothing was calling them. vercel.json now schedules both.
#
# The reminders job runs every hour. It looks at every published event
# from yesterday to a week out, works out which reminder is due, and
# sends it: a day before, an hour before, a thank you afterwards,
# whichever the host switched on. Every send is recorded, so running
# hourly cannot send the same one twice.
#
# It is safe to schedule before email exists. With no key it returns
# "skipped: No email key set" and stops, so the schedule can go in now
# and start working by itself the day Resend is connected.
#
# The tidy job runs at three in the morning and deletes recordings past
# their keeping time, which is 180 days. Anything published into Watch
# and Listen or attached to a lesson is content now and is left alone.
#
# Both now get a minute to run rather than the default ten seconds, and
# are never cached.
#
# One thing for you, in Vercel, Settings, Environment Variables:
#
#   CRON_SECRET = any long random string
#
# Vercel sends it as the authorisation header and both routes refuse
# anything else. Without it the jobs still run, but anyone who knows the
# address could set them off.
#
# And one thing to check: on the Hobby plan Vercel allows one run a day,
# so the hourly schedule would be reduced and the hour-before reminder
# would not go out on time. supabase/setup/cron-check.md says what to
# change if you are staying on Hobby.
#
#   powershell -ExecutionPolicy Bypass -File .\111-one-of-ten-the-scheduled-jobs.ps1

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
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/tidy",
      "schedule": "0 3 * * *"
    }
  ]
}
'@
Write-File "vercel.json" $f0

$f1 = @'
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendEmailToMember, emailReady, url } from "@/lib/email";
import { whenText } from "@/lib/events";

// Runs on a schedule. It sends each reminder once, because every send is
// recorded and checked before the next run.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  if (!emailReady) {
    return NextResponse.json({ skipped: "No email key set" });
  }

  const service = createAdminClient();
  const now = Date.now();

  const { data: events } = await service
    .from("events")
    .select("id, slug, title, starts_at, ends_at, timezone, venue, address, is_online, online_url, reminders, village_id")
    .eq("status", "published")
    // Everything from yesterday to a week out: the ones coming up, and the
    // ones just finished that owe people a thank you.
    .gte("starts_at", new Date(now - 2 * 86400000).toISOString())
    .lte("starts_at", new Date(now + 8 * 86400000).toISOString());

  let sent = 0;

  for (const event of events ?? []) {
    const hoursAway = (new Date(event.starts_at).getTime() - now) / 3600000;
    const reminders = (event.reminders ?? {}) as Record<string, boolean>;

    // Which reminder, if any, is due right now.
    let kind: string | null = null;
    if (reminders.thanks && hoursAway <= -14 && hoursAway > -40) kind = "thanks";
    else if (reminders.hour && hoursAway <= 1.5 && hoursAway > 0) kind = "hour";
    else if (reminders.day && hoursAway <= 26 && hoursAway > 22) kind = "day";
    else if (reminders.week && hoursAway <= 170 && hoursAway > 166) kind = "week";
    if (!kind) continue;

    // The thank you carries whatever is on next in that Village, which is
    // the only reason a thank you is worth sending.
    let nextUp: { title: string; slug: string } | null = null;
    if (kind === "thanks") {
      const { data: after } = await service
        .from("events")
        .select("title, slug")
        .eq("status", "published")
        .eq("village_id", event.village_id)
        .gt("starts_at", new Date(now).toISOString())
        .order("starts_at")
        .limit(1)
        .maybeSingle();
      nextUp = after ?? null;
    }

    const { data: registrations } = await service
      .from("event_registrations")
      .select("id, profile_id, guest_email, guest_name")
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    for (const registration of registrations ?? []) {
      const { data: already } = await service
        .from("event_reminders_sent")
        .select("id")
        .eq("registration_id", registration.id)
        .eq("kind", kind)
        .maybeSingle();

      if (already) continue;

      let to = registration.guest_email as string | null;
      let name = registration.guest_name as string | null;

      if (registration.profile_id) {
        const { data: profile } = await service
          .from("profiles")
          .select("email, full_name")
          .eq("id", registration.profile_id)
          .maybeSingle();
        to = profile?.email ?? null;
        name = profile?.full_name ?? null;
      }

      if (!to) continue;

      const where = event.is_online
        ? `Online. ${event.online_url ?? "The link is on the event page."}`
        : event.venue ?? "The venue is on the event page.";

      const send = registration.profile_id
        ? (subject: string, heading: string, lines: string[], action: { label: string; href: string }) =>
            sendEmailToMember(
              registration.profile_id as string,
              "events",
              to,
              subject,
              heading,
              lines,
              action
            )
        : (subject: string, heading: string, lines: string[], action: { label: string; href: string }) =>
            sendEmail(to as string, subject, heading, lines, action);

      await send(
        kind === "thanks"
          ? `Thank you for coming: ${event.title}`
          : kind === "hour"
            ? `Starting soon: ${event.title}`
            : kind === "day"
              ? `Tomorrow: ${event.title}`
              : `Next week: ${event.title}`,
        event.title,
        kind === "thanks"
          ? [
              `${name ? `${name.split(" ")[0]}, thank` : "Thank"} you for coming to ${event.title}.`,
              nextUp
                ? `Next in your Village: ${nextUp.title}.`
                : "The next one goes up shortly.",
              "If you met somebody worth following up with, the Directory has them.",
            ]
          : [
              `${name ? `${name.split(" ")[0]}, a` : "A"} reminder about ${event.title}.`,
              whenText(event),
              where,
              kind === "hour"
                ? "If you can no longer make it, cancel your place so someone else can take it."
                : "See you there.",
            ],
        kind === "thanks" && nextUp
          ? { label: "See what is next", href: url(`/events/${nextUp.slug}`) }
          : { label: "Open the event", href: url(`/events/${event.slug}`) }
      );

      await service.from("event_reminders_sent").insert({
        event_id: event.id,
        registration_id: registration.id,
        kind,
      });

      sent += 1;
    }
  }

  return NextResponse.json({ sent });
}
'@
Write-File "app\api\cron\reminders\route.ts" $f1

$f2 = @'
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { createAdminClient } from "@/lib/supabase/admin";

// Recordings are large and storage is not free. Anything past its keeping
// time goes, unless somebody published it into Watch and Listen or made it
// a lesson, in which case it is content now and stays.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const keepDays = Number(process.env.RECORDING_KEEP_DAYS ?? 180);
  const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString();
  const bucket = process.env.S3_BUCKET ?? "recordings";

  const service = createAdminClient();

  const { data: old } = await service
    .from("session_recordings")
    .select("id, url, created_at, media_item_id, lesson_id")
    .eq("status", "ready")
    .lt("created_at", cutoff)
    .is("media_item_id", null)
    .is("lesson_id", null)
    .limit(50);

  let removed = 0;

  for (const recording of old ?? []) {
    if (!recording.url) continue;

    const { error } = await service.storage.from(bucket).remove([recording.url]);
    if (error) continue;

    await service
      .from("session_recordings")
      .update({ status: "failed", url: null })
      .eq("id", recording.id);

    removed += 1;
  }

  return NextResponse.json({ removed, keepDays });
}
'@
Write-File "app\api\cron\tidy\route.ts" $f2

$f3 = @'
# The two scheduled jobs

Both are in vercel.json and run on Vercel's schedule. Neither has ever
run before today, because nothing was scheduling them.

## What they do

**/api/cron/reminders, every hour.** Looks at every published event
from yesterday to a week out, works out which reminder is due, and
sends it. A day before, an hour before, and a thank you afterwards,
whichever the host switched on for that event. Every send is recorded,
so running hourly cannot send the same reminder twice.

It does nothing at all until the email key is set. It returns
"skipped: No email key set" and stops, which is why it is safe to
schedule now.

**/api/cron/tidy, at three in the morning.** Deletes recordings past
their keeping time, which is 180 days unless RECORDING_KEEP_DAYS says
otherwise. Anything published into Watch and Listen, or attached to a
lesson, is content now and is left alone.

## One setting to add

In Vercel, Settings, Environment Variables, add:

    CRON_SECRET = <any long random string>

Vercel sends that as the authorisation header when it calls the job,
and both routes refuse anything else. Without it the jobs still run,
but anyone who knows the address could trigger them.

## If you are on the Hobby plan

Vercel only allows one run a day on Hobby. The hourly schedule will be
reduced, which means the hour-before reminder will not go out on time.
If you are staying on Hobby, change the reminders schedule to daily and
switch the hour-before reminder off on events:

    "schedule": "0 7 * * *"

## Checking it ran

Vercel, your project, the Cron Jobs tab, shows the last run and what it
returned. You can also call it yourself:

    curl https://expatpreneur.vercel.app/api/cron/reminders \
      -H "Authorization: Bearer <your CRON_SECRET>"
'@
Write-File "supabase\setup\cron-check.md" $f3

git add vercel.json app/api/cron supabase/setup/cron-check.md
git commit -m "Schedule the two jobs that have never run"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
    Write-Host ""
    Write-Host "Add CRON_SECRET in Vercel, then look at the Cron Jobs tab"
    Write-Host "after the next hour to see the first run."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
