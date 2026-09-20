"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/events";

export type LeadState = { error?: string; done?: string };

// A leader opens a room for the thing they run, without going through an
// admin. The database checks the role again on the way in.
export async function openRoomForMine(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/lead");

  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!title || !date || !time) {
    return { error: "A title, a date and a time are needed." };
  }

  const choice = String(formData.get("thing") ?? "");
  const [kind, id] = choice.split(":");

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("live_sessions").insert({
    slug: slugify(title),
    title,
    purpose: String(formData.get("purpose") ?? "").trim() || null,
    village_id: kind === "village" ? id : profile?.village_id ?? null,
    visibility: "private",
    audience: kind === "village" ? "village" : kind,
    audience_id: kind === "village" ? id : id,
    tier: "all",
    scheduled_start: new Date(`${date}T${time}:00`).toISOString(),
    timezone: String(formData.get("timezone") ?? "Asia/Dubai"),
    lobby: Boolean(formData.get("lobby")),
    max_participants: Number(formData.get("max_participants") ?? 50),
    recording: String(formData.get("recording") ?? "off"),
    created_by: user.id,
  });

  if (error) {
    return {
      error:
        "That was refused. Rooms are opened by people who run a Circle, a Group, a Pod or a Village.",
    };
  }

  revalidatePath("/lead");
  redirect("/lead?done=1");
}

export async function saveMyGroup(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("industry_groups")
    .update({
      description: String(formData.get("description") ?? "").trim() || null,
      whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("group_id")));

  if (error) return { error: "Only the lead of that Group can change it." };

  revalidatePath("/lead");
  return { done: "saved" };
}

export async function saveMyPod(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pods")
    .update({
      purpose: String(formData.get("purpose") ?? "").trim() || null,
      whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
      cadence: String(formData.get("cadence") ?? "monthly"),
    })
    .eq("id", String(formData.get("pod_id")));

  if (error) return { error: "Only the lead of that Pod can change it." };

  revalidatePath("/lead");
  return { done: "saved" };
}