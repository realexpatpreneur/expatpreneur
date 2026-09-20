"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { slugify } from "@/lib/events";

export type SessionFormState = { error?: string };

function audienceFrom(formData: FormData) {
  const choice = String(formData.get("audience") ?? "global");
  if (choice.startsWith("circle:")) {
    return { audience: "circle", audience_id: choice.slice(7) };
  }
  if (choice.startsWith("village:")) {
    return { audience: "village", audience_id: choice.slice(8) };
  }
  if (choice.startsWith("group:")) {
    return { audience: "group", audience_id: choice.slice(6) };
  }
  if (choice.startsWith("pod:")) {
    return { audience: "pod", audience_id: choice.slice(4) };
  }
  return { audience: "global", audience_id: null };
}

export async function saveSession(
  _prev: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!title || !date || !time) {
    return { error: "A title, a date and a time are needed." };
  }

  const { audience, audience_id } = audienceFrom(formData);
  const endTime = String(formData.get("end_time") ?? "");
  const visibility = String(formData.get("visibility") ?? "private");

  const row = {
    title,
    purpose: String(formData.get("purpose") ?? "").trim() || null,
    village_id:
      audience === "village" && audience_id
        ? audience_id
        : admin.homeVillageId ?? admin.villageIds[0] ?? null,
    event_id: String(formData.get("event_id") ?? "") || null,
    visibility,
    audience,
    audience_id,
    tier: String(formData.get("tier") ?? "all"),
    scheduled_start: new Date(`${date}T${time}:00`).toISOString(),
    scheduled_end: endTime ? new Date(`${date}T${endTime}:00`).toISOString() : null,
    timezone: String(formData.get("timezone") ?? "Asia/Dubai"),
    lobby: Boolean(formData.get("lobby")),
    chat: Boolean(formData.get("chat")),
    hand_raise: Boolean(formData.get("hand_raise")),
    allow_guests: visibility === "public" && Boolean(formData.get("allow_guests")),
    max_participants: Number(formData.get("max_participants") ?? 100),
    recording: String(formData.get("recording") ?? "off"),
  };

  const id = String(formData.get("id") ?? "");

  const { error } = id
    ? await supabase.from("live_sessions").update(row).eq("id", id)
    : await supabase
        .from("live_sessions")
        .insert({ ...row, slug: slugify(title), created_by: admin.userId });

  if (error) return { error: error.message };

  revalidatePath("/admin/live");
  redirect("/admin/live?done=1");
}

// Multi manager: anyone named here holds host powers alongside whoever
// already has them through their community role.
export async function addSessionHost(
  _prev: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("session_hosts").insert({
    session_id: String(formData.get("session_id")),
    profile_id: String(formData.get("profile_id")),
    role: String(formData.get("role") ?? "cohost"),
    added_by: admin.userId,
  });

  if (error) return { error: "They already hold a role in this room." };

  revalidatePath("/admin/live");
  return {};
}