# 25-recording-and-streaming.ps1
# Recording a live room, and streaming it out to YouTube, LinkedIn or
# anywhere else that takes RTMP, to several at once. Recordings land in our
# own Supabase storage, not with a third party, and a finished one can be
# published into Watch and Listen in one press.
#
# After running, add to Vercel when you are ready to record:
#   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
# from Supabase, Project settings, Storage, S3 access keys.
#
# And in LiveKit, Settings, Webhooks, add:
#   https://expatpreneur.vercel.app/api/live/webhook
#
#   powershell -ExecutionPolicy Bypass -File .\25-recording-and-streaming.ps1

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
import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

// Recording and streaming out. LiveKit does the work; the files land in our
// own Supabase storage, which speaks S3, so nothing lives with a third
// party longer than the upload takes.

export const recordingReady = Boolean(
  process.env.LIVEKIT_API_KEY &&
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
);

export function egressClient() {
  return new EgressClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

function fileOutput(sessionId: string) {
  return new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: `${sessionId}/{time}.mp4`,
    output: {
      case: "s3",
      value: new S3Upload({
        endpoint: process.env.S3_ENDPOINT!,
        region: process.env.S3_REGION ?? "us-east-1",
        accessKey: process.env.S3_ACCESS_KEY!,
        secret: process.env.S3_SECRET_KEY!,
        bucket: process.env.S3_BUCKET ?? "recordings",
        forcePathStyle: true,
      }),
    },
  });
}

// One recording of the whole room, laid out the way people saw it.
export async function startRecording(room: string, sessionId: string) {
  const egress = await egressClient().startRoomCompositeEgress(
    room,
    { file: fileOutput(sessionId) },
    { layout: "speaker" }
  );
  return egress.egressId;
}

// Out to YouTube, LinkedIn, Instagram, or several at once.
export async function startStreaming(room: string, urls: string[]) {
  const egress = await egressClient().startRoomCompositeEgress(
    room,
    {
      stream: new StreamOutput({ protocol: StreamProtocol.RTMP, urls }),
    },
    { layout: "speaker" }
  );
  return egress.egressId;
}

export async function stopEgress(egressId: string) {
  await egressClient().stopEgress(egressId);
}
'@
Write-File "lib\egress.ts" $file0

$file1 = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
      external_url: recording.url,
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
'@
Write-File "app\live\actions.ts" $file1

$file2 = @'
"use client";

import { useActionState } from "react";
import {
  knockOnDoor,
  leaveRoom,
  decideOnParticipant,
  setParticipantRole,
  setSessionStatus,
  beginRecording,
  endRecording,
  beginStreaming,
  endStreaming,
  addStreamTarget,
  publishRecording,
  type LiveState,
} from "./actions";

export function KnockButton({
  sessionId,
  slug,
  lobby,
  label,
}: {
  sessionId: string;
  slug: string;
  lobby: boolean;
  label: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    knockOnDoor,
    {}
  );

  if (state.done === "waiting") {
    return (
      <div className="notice good">
        You are at the door. A host will let you in.
      </div>
    );
  }
  if (state.done === "admitted") {
    return <div className="notice good">You are in the room.</div>;
  }

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lobby" value={lobby ? "1" : "0"} />
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Knocking" : label}
      </button>
    </form>
  );
}

export function LeaveButton({
  sessionId,
  slug,
}: {
  sessionId: string;
  slug: string;
}) {
  const [, action, pending] = useActionState<LiveState, FormData>(leaveRoom, {});

  return (
    <form action={action}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Leaving" : "Leave the room"}
      </button>
    </form>
  );
}

export function DoorDecision({
  participantId,
  slug,
  state: current,
}: {
  participantId: string;
  slug: string;
  state: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    decideOnParticipant,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="slug" value={slug} />
      {current === "waiting" ? (
        <button className="btn primary" name="decision" value="admit" disabled={pending}>
          Let them in
        </button>
      ) : null}
      <button className="btn" name="decision" value="remove" disabled={pending}>
        Remove
      </button>
    </form>
  );
}

export function RoleSelect({
  participantId,
  slug,
  role,
}: {
  participantId: string;
  slug: string;
  role: string;
}) {
  const [, action, pending] = useActionState<LiveState, FormData>(
    setParticipantRole,
    {}
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="slug" value={slug} />
      <select name="role" defaultValue={role}>
        <option value="participant">In the room</option>
        <option value="presenter">Presenter</option>
        <option value="cohost">Co-host</option>
        <option value="observer">Watching</option>
      </select>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Set"}
      </button>
    </form>
  );
}

export function SessionControls({
  sessionId,
  slug,
  status,
}: {
  sessionId: string;
  slug: string;
  status: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    setSessionStatus,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      {status !== "live" ? (
        <button className="btn primary" name="status" value="live" disabled={pending}>
          Open the room
        </button>
      ) : (
        <button className="btn" name="status" value="ended" disabled={pending}>
          End the session
        </button>
      )}
    </form>
  );
}

export function RecordingControls({
  sessionId,
  slug,
  recording,
}: {
  sessionId: string;
  slug: string;
  recording: { id: string; status: string; url: string | null; media_item_id: string | null } | null;
}) {
  const [startState, startAction, starting] = useActionState<LiveState, FormData>(
    beginRecording,
    {}
  );
  const [stopState, stopAction, stopping] = useActionState<LiveState, FormData>(
    endRecording,
    {}
  );
  const [publishState, publishAction, publishing] = useActionState<LiveState, FormData>(
    publishRecording,
    {}
  );

  const running = recording?.status === "recording";

  return (
    <div>
      {startState.error ? <div className="notice bad">{startState.error}</div> : null}
      {stopState.error ? <div className="notice bad">{stopState.error}</div> : null}
      {publishState.error ? (
        <div className="notice bad">{publishState.error}</div>
      ) : null}
      {publishState.done === "published" ? (
        <div className="notice good">
          It is in Watch and Listen, for members only.
        </div>
      ) : null}

      {running ? (
        <form action={stopAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn" type="submit" disabled={stopping}>
            {stopping ? "Stopping" : "Stop recording"}
          </button>
        </form>
      ) : (
        <form action={startAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn primary" type="submit" disabled={starting}>
            {starting ? "Starting" : "Start recording"}
          </button>
        </form>
      )}

      {recording && recording.status === "processing" ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          Being processed. It appears here when it is ready.
        </p>
      ) : null}

      {recording?.status === "ready" && recording.url ? (
        <div style={{ marginTop: 12 }}>
          <a className="btn" href={recording.url} target="_blank" rel="noreferrer">
            Watch it back
          </a>
          {recording.media_item_id ? null : (
            <form action={publishAction} style={{ marginTop: 8 }}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="recording_id" value={recording.id} />
              <button className="btn" type="submit" disabled={publishing}>
                {publishing ? "Publishing" : "Put it in Watch and Listen"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function StreamingControls({
  sessionId,
  slug,
  targets,
}: {
  sessionId: string;
  slug: string;
  targets: { id: string; platform: string; status: string }[];
}) {
  const [addState, addAction, adding] = useActionState<LiveState, FormData>(
    addStreamTarget,
    {}
  );
  const [startState, startAction, starting] = useActionState<LiveState, FormData>(
    beginStreaming,
    {}
  );
  const [stopState, stopAction, stopping] = useActionState<LiveState, FormData>(
    endStreaming,
    {}
  );

  const live = targets.some((t) => t.status === "live");

  return (
    <div>
      {addState.error ? <div className="notice bad">{addState.error}</div> : null}
      {startState.error ? <div className="notice bad">{startState.error}</div> : null}
      {stopState.error ? <div className="notice bad">{stopState.error}</div> : null}

      {targets.length ? (
        <div className="rows" style={{ marginBottom: 12 }}>
          {targets.map((target) => (
            <div className="rowlink" key={target.id}>
              <div>
                <b>{target.platform}</b>
              </div>
              <div className="rowmeta">
                <span className={`chip ${target.status === "live" ? "mint" : ""}`}>
                  {target.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {live ? (
        <form action={stopAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn" type="submit" disabled={stopping}>
            {stopping ? "Stopping" : "Stop streaming"}
          </button>
        </form>
      ) : (
        <>
          <form action={addAction}>
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="slug" value={slug} />
            <label className="field">
              <span>Where to</span>
              <select name="platform" defaultValue="youtube">
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="custom">Somewhere else</option>
              </select>
            </label>
            <label className="field">
              <span>RTMP address</span>
              <input name="rtmp_url" placeholder="rtmp://a.rtmp.youtube.com/live2" />
            </label>
            <label className="field">
              <span>Stream key</span>
              <input name="stream_key" />
              <span className="hint">
                Only hosts of this session can see these.
              </span>
            </label>
            <button className="btn" type="submit" disabled={adding}>
              {adding ? "Saving" : "Add destination"}
            </button>
          </form>

          {targets.length ? (
            <form action={startAction} style={{ marginTop: 12 }}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="slug" value={slug} />
              <button className="btn primary" type="submit" disabled={starting}>
                {starting ? "Starting" : "Go live to them"}
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
'@
Write-File "app\live\forms.tsx" $file2

$file3 = @'
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
  RecordingControls,
  StreamingControls,
} from "../forms";
import { recordingReady } from "@/lib/egress";

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

  // Hosts see the recording and the places it is being sent. Nobody else
  // can even read those rows.
  const [{ data: recordings }, { data: targets }] = isHost
    ? await Promise.all([
        supabase
          .from("session_recordings")
          .select("id, status, url, media_item_id")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("stream_targets")
          .select("id, platform, status")
          .eq("session_id", session.id),
      ])
    : [{ data: [] }, { data: [] }];

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

              {isHost && session.recording !== "off" ? (
                <div className="panel">
                  <h3>Recording</h3>
                  {recordingReady ? (
                    <>
                      <p className="muted small" style={{ marginTop: 6 }}>
                        Everyone in the room is told when it starts. The file
                        lands in our own storage, and only the people this
                        session was open to can watch it.
                      </p>
                      <RecordingControls
                        sessionId={session.id}
                        slug={slug}
                        recording={(recordings ?? [])[0] ?? null}
                      />
                    </>
                  ) : (
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Recording needs the storage keys before it can run.
                    </p>
                  )}
                </div>
              ) : null}

              {isHost ? (
                <div className="panel">
                  <h3>Streaming out</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Send the room to YouTube, LinkedIn or anywhere that takes
                    RTMP, to more than one at a time.
                  </p>
                  <StreamingControls
                    sessionId={session.id}
                    slug={slug}
                    targets={targets ?? []}
                  />
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
Write-File "app\live\[slug]\page.tsx" $file3

$file4 = @'
import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

// LiveKit tells us when a recording finished, where the file went, and how
// long it runs. Nothing else is trusted to say a recording is ready.
export async function POST(request: Request) {
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) {
    return NextResponse.json({ error: "Live is off" }, { status: 503 });
  }

  const receiver = new WebhookReceiver(key, secret);
  const body = await request.text();
  const authorization = request.headers.get("authorization") ?? "";

  let event;
  try {
    event = await receiver.receive(body, authorization);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const service = createAdminClient();

  if (event.event === "egress_ended" || event.event === "egress_updated") {
    const info = event.egressInfo;
    if (!info) return NextResponse.json({ received: true });

    const file = info.fileResults?.[0];
    const seconds = file?.duration ? Number(file.duration) / 1_000_000_000 : null;

    const patch: Record<string, unknown> = {
      status:
        info.status === 3 || event.event === "egress_ended" ? "ready" : "recording",
    };

    if (file?.location) {
      patch.url = file.location;
      patch.size_bytes = file.size ? Number(file.size) : null;
      patch.duration = seconds
        ? `${Math.round(seconds / 60)} minutes`
        : null;
    }

    await service
      .from("session_recordings")
      .update(patch)
      .eq("provider_ref", info.egressId);
  }

  // When the room empties, the session is over.
  if (event.event === "room_finished" && event.room?.name) {
    await service
      .from("live_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("provider_room", event.room.name)
      .eq("status", "live");
  }

  return NextResponse.json({ received: true });
}
'@
Write-File "app\api\live\webhook\route.ts" $file4

$file5 = @'
# Supabase, Project settings, API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server side only. Never expose this to the browser.
SUPABASE_SERVICE_ROLE_KEY=

# The address the site runs on, used for sign in links
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Later: membership and event tickets
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MEMBERSHIP_PRICE_ID=
# Transactional email
RESEND_API_KEY=
EMAIL_FROM=ExpatPreneurs <hello@expatpreneurs.com>
# Protects the reminder job
CRON_SECRET=

# Live rooms, LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Where recordings are kept. Supabase Storage speaks S3, so these come from
# Supabase, Project settings, Storage, S3 access keys.
S3_ENDPOINT=https://your-project.storage.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=recordings
'@
Write-File ".env.example" $file5

git add .
git commit -m "Live rooms: recording into our own storage, streaming out over RTMP, and publishing recordings"
git push

Write-Host ""
Write-Host "Pushed."
