# 123-the-seed-broke-events-and-discover.ps1
# My fault, and two of your pages are down. No migration, but one piece
# of SQL to run: fix-timezones.sql.
#
# Events and Discover both throw. Neither did before last night, and the
# only thing that changed is the content I seeded.
#
# The timezone column holds an identifier the date formatter
# understands, such as Asia/Dubai. The forms have always known that:
# they show Gulf Standard Time and store Asia/Dubai. I seeded the
# friendly names straight out of the prototype, where they were only
# ever labels on a screen. An unknown zone makes the formatter throw,
# and a throw inside a page takes the whole page with it, which is why
# you got the error page rather than an event with a wrong time on it.
#
# Two fixes, because the data being wrong and the page dying from it are
# two different faults.
#
# fix-timezones.sql corrects the rows, and then shows you anything else
# in either table that is not an identifier.
#
# And whenText and the live room equivalent now check a zone before
# using it, falling back to the reader's own. A single bad row can no
# longer take down Events, Discover, a Village page, the member feed or
# a live session. I tested the guard against the exact value that broke
# it.
#
# The seed file in the repository is corrected too, so running it again
# writes identifiers.
#
# Run in Supabase:
#   fix-timezones.sql
#
#   powershell -ExecutionPolicy Bypass -File .\123-the-seed-broke-events-and-discover.ps1

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
// Shared helpers for events: how a time reads, and who may register.

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  venue: string | null;
  address: string | null;
  release_hours: number;
  is_online: boolean;
  online_url: string | null;
  waitlist: boolean;
  visibility: string;
  audience: string;
  audience_id: string | null;
  tier: string;
  requires_approval: boolean;
  show_guest_list: boolean;
  capacity: number;
  visitor_places: number;
  price_cents: number;
  currency: string;
  status: string;
  village_id: string | null;
  host_id: string | null;
};

// A timezone the formatter does not recognise throws, and one bad row
// should never take a page down. Anything unknown falls back to the
// reader's own zone.
function safeZone(zone: string | null | undefined) {
  if (!zone) return undefined;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}

export function whenText(event: { starts_at: string; ends_at: string | null; timezone: string }) {
  const zone = safeZone(event.timezone);
  const start = new Date(event.starts_at);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: zone,
  });
  const from = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone,
  });
  if (!event.ends_at) return `${date}, ${from}`;
  const to = new Date(event.ends_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone,
  });
  return `${date}, ${from} to ${to}`;
}

export function priceText(event: { price_cents: number; currency: string }) {
  if (!event.price_cents) return "Free";
  return `${(event.price_cents / 100).toFixed(2)} ${event.currency}`;
}

// Who the event is open to, in a line a member can read.
export function audienceText(
  event: { visibility: string; audience: string; tier: string },
  audienceName: string | null
) {
  if (event.visibility === "public") return "Anyone, on or off the platform";
  const who =
    event.audience === "global"
      ? "Members in every Village"
      : audienceName ?? "Members";
  return event.tier === "paid" ? `${who}, paid members only` : who;
}

// The same rules the database enforces, so the page can explain itself
// instead of failing on submit.
export function registrationBlock(
  event: EventRow,
  member: { plan: string; village_id: string | null; circle_id: string | null } | null
): string | null {
  if (event.visibility === "public") return null;
  if (!member) return "This event is for members.";
  if (event.tier === "paid" && member.plan !== "paid") {
    return "This event is open to paid members.";
  }
  if (event.audience === "village" && event.audience_id !== member.village_id) {
    return member.plan === "paid"
      ? null
      : "Attending events in other Villages is part of the paid plan.";
  }
  if (event.audience === "circle" && event.audience_id !== member.circle_id) {
    return "This event is for one Circle.";
  }
  return null;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "event"}-${suffix}`;
}
'@
Write-File "lib\events.ts" $f0

$f1 = @'
// Live sessions, the community side. Nothing here knows which media
// provider carries the audio and video.

export type LiveSession = {
  id: string;
  slug: string;
  title: string;
  purpose: string | null;
  event_id: string | null;
  village_id: string | null;
  visibility: string;
  audience: string;
  audience_id: string | null;
  tier: string;
  scheduled_start: string;
  scheduled_end: string | null;
  timezone: string;
  lobby: boolean;
  chat: boolean;
  hand_raise: boolean;
  allow_guests: boolean;
  max_participants: number;
  recording: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  provider: string | null;
  provider_room: string | null;
  created_by: string | null;
};

export const roleLabel: Record<string, string> = {
  host: "Host",
  cohost: "Co-host",
  presenter: "Presenter",
  participant: "In the room",
  observer: "Watching",
};

export const stateLabel: Record<string, string> = {
  invited: "Invited",
  waiting: "Waiting to be let in",
  admitted: "In the room",
  removed: "Removed",
  left: "Left",
};

// The same rules the database enforces, so a page can explain itself
// rather than failing when someone presses join.
export function joinBlock(
  session: LiveSession,
  member: { plan: string; village_id: string | null; circle_id: string | null } | null,
  isHost: boolean
): string | null {
  if (isHost) return null;
  if (session.visibility === "public" && session.allow_guests) return null;
  if (!member) return "This room is for members.";
  if (session.tier === "paid" && member.plan !== "paid") {
    return "This room is open to paid members.";
  }
  if (session.audience === "village" && session.audience_id !== member.village_id) {
    return member.plan === "paid"
      ? null
      : "Rooms in other Villages are part of the paid plan.";
  }
  if (session.audience === "circle" && session.audience_id !== member.circle_id) {
    return "This room is for one Circle.";
  }
  return null;
}

function safeZone(zone: string | null | undefined) {
  if (!zone) return undefined;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}

export function sessionWhen(session: {
  scheduled_start: string;
  scheduled_end: string | null;
  timezone: string;
}) {
  const start = new Date(session.scheduled_start);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: safeZone(session.timezone),
  });
  const from = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: safeZone(session.timezone),
  });
  if (!session.scheduled_end) return `${date}, ${from}`;
  const to = new Date(session.scheduled_end).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: safeZone(session.timezone),
  });
  return `${date}, ${from} to ${to}`;
}

// Whether the doors are worth opening yet: fifteen minutes before, and
// while it is running.
export function doorsOpen(session: LiveSession) {
  if (session.status === "live") return true;
  if (session.status !== "scheduled") return false;
  const minutes =
    (new Date(session.scheduled_start).getTime() - Date.now()) / 60000;
  return minutes <= 15;
}
'@
Write-File "lib\live.ts" $f1

git add lib supabase/migrations/0045_seed_from_prototype.sql
git commit -m "A bad timezone no longer takes a page down, and the seed writes real ones"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run fix-timezones.sql in Supabase, then reload /events."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
