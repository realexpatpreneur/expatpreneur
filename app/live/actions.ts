"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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