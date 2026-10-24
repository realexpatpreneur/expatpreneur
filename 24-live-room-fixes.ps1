# 24-live-room-fixes.ps1
# Four things the first live test turned up.
# 1. Leaving was reported twice, once by the disconnect and once by the page
#    closing, so the minutes were roughly double. Now it is reported once.
# 2. A host who had just opened the room was still offered the lobby.
# 3. The room page printed the session title twice.
# 4. Scheduling defaulted to Every Village. It now defaults to the admin's
#    own Village, for live sessions and for events, so the whole network has
#    to be chosen on purpose.
#
#   powershell -ExecutionPolicy Bypass -File .\24-live-room-fixes.ps1

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

$file0 = @'
"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  formatChatMessageLinks,
} from "@livekit/components-react";
import "@livekit/components-styles";

type Ready = {
  token: string;
  url: string;
  role: string;
  canSpeak: boolean;
  recording: string;
  title: string;
};

// The room. Everything about who may be here was settled before this
// component ever runs.
export function RoomClient({ slug, onLeaveHref }: { slug: string; onLeaveHref: string }) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joinedAt = useRef<number>(Date.now());
  const reported = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "That did not work.");
        if (!cancelled) {
          setReady(data as Ready);
          joinedAt.current = Date.now();
        }
      } catch (problem) {
        if (!cancelled) {
          setError(problem instanceof Error ? problem.message : "That did not work.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Tell the platform how long they were actually here, once. Closing the
  // tab and pressing leave both end up here, and only the first one counts.
  useEffect(() => {
    function report() {
      if (reported.current) return;
      reported.current = true;
      const seconds = Math.round((Date.now() - joinedAt.current) / 1000);
      const body = JSON.stringify({ slug, seconds });
      navigator.sendBeacon?.("/api/live/leave", new Blob([body], { type: "application/json" }));
    }
    window.addEventListener("pagehide", report);
    return () => window.removeEventListener("pagehide", report);
  }, [slug]);

  if (error) {
    return (
      <div className="panel">
        <h3>Not in the room</h3>
        <div className="notice bad">{error}</div>
        <a className="btn" href={onLeaveHref}>
          Back to the session
        </a>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="panel">
        <p className="muted" style={{ margin: 0 }}>
          Opening the room.
        </p>
      </div>
    );
  }

  return (
    <div className="roomwrap">
      {ready.recording !== "off" ? (
        <div className="notice bad">
          This session is recorded. Anything you say or show may be watched
          afterwards by the people it was open to.
        </div>
      ) : null}

      <LiveKitRoom
        token={ready.token}
        serverUrl={ready.url}
        connect
        audio={ready.canSpeak}
        video={ready.canSpeak}
        data-lk-theme="default"
        style={{ height: "72vh", borderRadius: 12, overflow: "hidden" }}
        onDisconnected={() => {
          if (reported.current) {
            window.location.href = onLeaveHref;
            return;
          }
          reported.current = true;
          const seconds = Math.round((Date.now() - joinedAt.current) / 1000);
          fetch("/api/live/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, seconds }),
            keepalive: true,
          }).finally(() => {
            window.location.href = onLeaveHref;
          });
        }}
      >
        <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {!ready.canSpeak ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          You are watching this one. A host can give you the floor, and then
          your camera and microphone become available.
        </p>
      ) : null}
    </div>
  );
}
'@
Write-File "app\live\[slug]\room\room-client.tsx" $file0

$file1 = @'
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { liveReady } from "@/lib/livekit";
import { roleLabel, type LiveSession } from "@/lib/live";
import { SiteHeader } from "@/components/site-header";
import { RoomClient } from "./room-client";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireMember(`/live/${slug}/room`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const session = data as LiveSession;

  const { data: role } = await supabase.rpc("session_role_for", { s: session });
  const myRole = (role as string) ?? "participant";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/live">Live rooms</Link>
          </p>
          <h1 style={{ fontSize: 26 }}>{session.title}</h1>
          <p className="muted small">
            You are here as {roleLabel[myRole]?.toLowerCase() ?? myRole}.
          </p>
        </section>

        <section className="band">
          {liveReady ? (
            <RoomClient slug={slug} onLeaveHref={`/live/${slug}`} />
          ) : (
            <div className="panel">
              <h3>Live video is not switched on yet</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Everything around the room works: who may come in, the lobby,
                the roles and the attendance. The audio and video need the
                LiveKit keys in the environment.
              </p>
              <Link className="btn" href={`/live/${slug}`}>
                Back to the session
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
'@
Write-File "app\live\[slug]\room\page.tsx" $file1

$file2 = @'
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
                ) : isHost ? (
                  <>
                    <h3>You run this room</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      You do not knock. Use the controls below to open it and
                      go in.
                    </p>
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
Write-File "app\live\[slug]\page.tsx" $file2

$file3 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { SessionForm } from "../forms";

export const metadata = { title: "Schedule a session, Admin" };

export default async function NewSessionPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: villages }, { data: circles }, { data: groups }, { data: pods }, { data: events }] =
    await Promise.all([
      supabase.from("villages").select("id, name").order("name"),
      supabase.from("circles").select("id, name, village_id").order("name"),
      supabase.from("industry_groups").select("id, name").order("name"),
      supabase.from("pods").select("id, name, village_id").order("name"),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(20),
    ]);

  const mine = (villages ?? []).filter(
    (v) => admin.isGlobal || admin.villageIds.includes(v.id)
  );

  // Their own Village first, because that is what a Local Admin usually
  // means. Every Village has to be chosen on purpose.
  const home = mine.find((v) => v.id === admin.homeVillageId) ?? mine[0];

  const audiences = [
    ...(home
      ? [{ value: `village:${home.id}`, label: `${home.name} Village` }]
      : []),
    { value: "global", label: "Every Village" },
    ...mine
      .filter((v) => v.id !== home?.id)
      .map((v) => ({ value: `village:${v.id}`, label: `${v.name} Village` })),
    ...(circles ?? [])
      .filter((c) => admin.isGlobal || admin.villageIds.includes(c.village_id))
      .map((c) => ({ value: `circle:${c.id}`, label: c.name })),
    ...(groups ?? []).map((g) => ({ value: `group:${g.id}`, label: g.name })),
    ...(pods ?? [])
      .filter((p) => admin.isGlobal || !p.village_id || admin.villageIds.includes(p.village_id))
      .map((p) => ({ value: `pod:${p.id}`, label: p.name })),
  ];

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/live">Live rooms</Link>
        </p>
        <h1>Schedule a session</h1>
        <p className="lead">
          A room can belong to a Village, a Circle, an Industry Group, a Pod or
          the whole network, and it follows the same rules as everything else.
        </p>
      </section>
      <section className="band">
        <SessionForm
          audiences={audiences}
          events={(events ?? []).map((e) => ({ value: e.id, label: e.title }))}
        />
      </section>
    </main>
  );
}
'@
Write-File "app\admin\live\new\page.tsx" $file3

$file4 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { EventForm } from "../forms";

export const metadata = { title: "Create an event, Admin" };

export default async function NewEventPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: villages }, { data: circles }] = await Promise.all([
    supabase.from("villages").select("id, name").order("name"),
    supabase.from("circles").select("id, name, village_id").order("name"),
  ]);

  const mine = (villages ?? []).filter(
    (v) => admin.isGlobal || admin.villageIds.includes(v.id)
  );

  const home = mine.find((v) => v.id === admin.homeVillageId) ?? mine[0];

  const audiences = [
    ...(home
      ? [{ value: `village:${home.id}`, label: `${home.name} Village` }]
      : []),
    { value: "global", label: "Every Village" },
    ...mine
      .filter((v) => v.id !== home?.id)
      .map((v) => ({ value: `village:${v.id}`, label: `${v.name} Village` })),
    ...(circles ?? [])
      .filter((c) => admin.isGlobal || admin.villageIds.includes(c.village_id))
      .map((c) => ({ value: `circle:${c.id}`, label: c.name })),
  ];

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/events">Events</Link>
        </p>
        <h1>Create an event</h1>
        <p className="lead">
          Public events can be found and booked by anyone. Private ones are for
          the members you choose.
        </p>
      </section>
      <section className="band">
        <EventForm audiences={audiences} />
      </section>
    </main>
  );
}
'@
Write-File "app\admin\events\new\page.tsx" $file4

git add .
git commit -m "Live room fixes: leave counted once, host lobby, duplicated title, audience default"
git push

Write-Host ""
Write-Host "Pushed."
