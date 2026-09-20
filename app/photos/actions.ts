"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PhotoState = { error?: string; done?: string };

export async function addPhoto(
  _prev: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const url = String(formData.get("photo_url") ?? "").trim();
  if (!url) return { error: "Choose a photograph first." };

  const eventId = String(formData.get("event_id"));
  const { data: event } = await supabase
    .from("events")
    .select("village_id")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await supabase.from("event_photos").insert({
    event_id: eventId,
    village_id: event?.village_id ?? null,
    uploader_id: user.id,
    url,
    caption: String(formData.get("caption") ?? "").trim() || null,
  });

  if (error) {
    return {
      error:
        "That was refused. Photographs go up by the people who were there.",
    };
  }

  revalidatePath(`/events/${slug}`);
  revalidatePath("/photos");
  return { done: "added" };
}

export async function removePhoto(
  _prev: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", String(formData.get("photo_id")));

  if (error) return { error: "That could not be taken down." };

  revalidatePath(`/events/${String(formData.get("slug"))}`);
  revalidatePath("/photos");
  return {};
}