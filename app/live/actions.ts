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