# 23-fix-cron-and-restore-session-page.ps1
# Two fixes.
# 1. vercel.json asked for an hourly cron, which a Hobby account refuses, and
#    that is why every deploy since the email slice was rejected before it
#    built. The file is removed and the hourly schedule moves to GitHub
#    Actions, which costs nothing.
# 2. Script 20 ran a second time after script 22 and put back an older copy
#    of the live session page. This restores the Enter the room button.
#
# After running, add two repository secrets in GitHub, under
# Settings, Secrets and variables, Actions:
#   CRON_SECRET  the same value as in Vercel
#   SITE_URL     https://expatpreneur.vercel.app
#
#   powershell -ExecutionPolicy Bypass -File .\23-fix-cron-and-restore-session-page.ps1

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

if (Test-Path (Join-Path $root "vercel.json")) {
    Remove-Item (Join-Path $root "vercel.json")
    Write-Host "removed vercel.json"
}

# Keep the Vercel link out of the repository.
$ignore = Join-Path $root ".gitignore"
if (-not (Select-String -Path $ignore -Pattern "^\.vercel$" -Quiet)) {
    Add-Content -Path $ignore -Value ".vercel"
    Write-Host "added .vercel to .gitignore"
}

$file0 = @'
# Event reminders, hourly.
# Vercel Hobby only allows one cron run a day, so the schedule lives here
# instead. The job simply calls the same endpoint the platform already has.
name: Event reminders

on:
  schedule:
    - cron: "5 * * * *"      # five past every hour, UTC
  workflow_dispatch:          # and a button, for testing

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Call the reminder job
        run: |
          code=$(curl -s -o response.txt -w "%{http_code}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.SITE_URL }}/api/cron/reminders")
          echo "status $code"
          cat response.txt
          if [ "$code" != "200" ]; then exit 1; fi
'@
Write-File ".github\workflows\reminders.yml" $file0

$file1 = @'
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import {
  sessionWhen,
  joinBlock,
  doorsOpen,
  roleLabel,
  stateLabel,
  type LiveSession,
} from "@/lib/live";
import { SiteHeader } from "@/components/site-header";
import {
  KnockButton,
  LeaveButton,
  DoorDecision,
  RoleSelect,
  SessionControls,
} from "../forms";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/live");
  const supabase = await createClient();

  const { data } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const session = data as LiveSession;

  // The database answers both of these, so the page and the rules can
  // never drift apart.
  const [{ data: role }, { data: allowed }] = await Promise.all([
    supabase.rpc("session_role_for", { s: session }),
    supabase.rpc("can_join_session", { s: session }),
  ]);

  const myRole = (role as string) ?? "participant";
  const isHost = ["host", "cohost"].includes(myRole);

  const [{ data: participants }, { data: village }, { data: event }] =
    await Promise.all([
      supabase
        .from("session_participants")
        .select("id, profile_id, guest_name, role, state, joined_at")
        .eq("session_id", session.id)
        .order("created_at"),
      session.village_id
        ? supabase
            .from("villages")
            .select("name")
            .eq("id", session.village_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      session.event_id
        ? supabase
            .from("events")
            .select("slug, title")
            .eq("id", session.event_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const ids = (participants ?? [])
    .map((p) => p.profile_id)
    .filter(Boolean) as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", ids)
    : { data: [] };

  const nameOf = (row: { profile_id: string | null; guest_name: string | null }) =>
    row.guest_name ??
    people?.find((p) => p.id === row.profile_id)?.full_name ??
    "A member";

  const mine = (participants ?? []).find((p) => p.profile_id === member.id);
  const waiting = (participants ?? []).filter((p) => p.state === "waiting");
  const inside = (participants ?? []).filter((p) => p.state === "admitted");
  const blocked = joinBlock(session, member, isHost) ?? (allowed ? null : "This room is not open to you.");
  const open = doorsOpen(session);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/live">Live rooms</Link>
          </p>
          <p>
            <span className={`chip ${session.status === "live" ? "mint" : ""}`}>
              {session.status === "live" ? "Happening now" : session.status}
            </span>{" "}
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {session.tier === "paid" ? (
              <span className="chip sun">Paid members</span>
            ) : null}{" "}
            {session.recording !== "off" ? (
              <span className="chip">Recorded</span>
            ) : null}
          </p>
          <h1>{session.title}</h1>
          <p className="lead">{sessionWhen(session)}</p>
          {event ? (
            <p className="muted small">
              Part of <Link href={`/events/${event.slug}`}>{event.title}</Link>
            </p>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              {session.purpose ? (
                <div className="panel">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {session.purpose}
                  </p>
                </div>
              ) : null}

              <div className="panel">
                <h3>The room</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Camera, microphone, screen share and chat. Hosts can mute
                  someone, give them the floor or remove them.
                </p>
                <dl className="kv">
                  <dt>Your role</dt>
                  <dd>{roleLabel[myRole] ?? myRole}</dd>
                  <dt>You are</dt>
                  <dd>{mine ? stateLabel[mine.state] ?? mine.state : "Not at the door yet"}</dd>
                  <dt>Lobby</dt>
                  <dd>
                    {session.lobby
                      ? "A host lets people in one by one."
                      : "Anyone allowed walks straight in."}
                  </dd>
                  <dt>Room size</dt>
                  <dd>{session.max_participants}</dd>
                  <dt>Recording</dt>
                  <dd>
                    {session.recording === "off"
                      ? "Not recorded"
                      : session.recording === "always"
                        ? "Recorded, and everyone is told when it starts"
                        : "Recorded if the host chooses, and everyone is told"}
                  </dd>
                </dl>
              </div>

              {isHost ? (
                <div className="panel">
                  <h3>At the door</h3>
                  {waiting.length === 0 ? (
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Nobody waiting.
                    </p>
                  ) : (
                    <div className="rows" style={{ marginTop: 12 }}>
                      {waiting.map((person) => (
                        <div className="rowlink" key={person.id}>
                          <div>
                            <b>{nameOf(person)}</b>
                          </div>
                          <div className="rowmeta">
                            <DoorDecision
                              participantId={person.id}
                              slug={slug}
                              state={person.state}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="panel">
                <h3>In the room</h3>
                {inside.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {inside.map((person) => (
                      <div className="rowlink" key={person.id}>
                        <div>
                          <b>{nameOf(person)}</b>
                          <div className="muted small">
                            {roleLabel[person.role] ?? person.role}
                          </div>
                        </div>
                        <div className="rowmeta">
                          {isHost ? (
                            <RoleSelect
                              participantId={person.id}
                              slug={slug}
                              role={person.role}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                {blocked ? (
                  <>
                    <h3>{blocked}</h3>
                    <Link className="btn" href="/upgrade">
                      See the paid plan
                    </Link>
                  </>
                ) : mine && ["admitted", "waiting"].includes(mine.state) ? (
                  <>
                    <h3>
                      {mine.state === "waiting"
                        ? "Waiting to be let in"
                        : "You are in"}
                    </h3>
                    {mine.state === "admitted" ? (
                      <p>
                        <Link className="btn primary" href={`/live/${slug}/room`}>
                          Enter the room
                        </Link>
                      </p>
                    ) : null}
                    <LeaveButton sessionId={session.id} slug={slug} />
                  </>
                ) : !open ? (
                  <>
                    <h3>The doors open shortly before it starts</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Come back fifteen minutes before, and you will be able to
                      knock.
                    </p>
                  </>
                ) : (
                  <KnockButton
                    sessionId={session.id}
                    slug={slug}
                    lobby={session.lobby}
                    label={session.lobby ? "Knock on the door" : "Join the room"}
                  />
                )}
              </div>

              {isHost ? (
                <div className="panel">
                  <h3>Running it</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    You are the {roleLabel[myRole].toLowerCase()} here, either
                    because you made it or because of the role you hold in this
                    Village or Circle.
                  </p>
                  <SessionControls
                    sessionId={session.id}
                    slug={slug}
                    status={session.status}
                  />
                  <p style={{ marginTop: 12 }}>
                    <Link className="btn primary" href={`/live/${slug}/room`}>
                      Enter the room
                    </Link>
                  </p>
                </div>
              ) : null}

              <div className="panel wash">
                <h3>Who can be here</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {session.visibility === "public" && session.allow_guests
                    ? "Anyone with the link, whether they are a member or not."
                    : session.audience === "global"
                      ? session.tier === "paid"
                        ? "Paid members from every Village."
                        : "Members from every Village."
                      : session.audience === "circle"
                        ? "One Circle."
                        : `${village?.name ?? "This Village"}, and paid members visiting from elsewhere.`}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
'@
Write-File "app\live\[slug]\page.tsx" $file1

git add .
git commit -m "Move the reminder schedule to GitHub Actions and restore the live session page"
git push

Write-Host ""
Write-Host "Pushed. Deploys should work again now."
