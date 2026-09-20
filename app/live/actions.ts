"use server";

import { revalidatePath } from "next/cache";
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
      external_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app"}/api/live/recording/${recording.id}`,
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