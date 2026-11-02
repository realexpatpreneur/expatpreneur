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

  // This was the only action here that never asked who was calling, and
  // a delete that matches no rows is not an error, so pressing Take it
  // down on somebody else's photograph reported success and left it
  // exactly where it was.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const photoId = String(formData.get("photo_id"));

  const { data: photo } = await supabase
    .from("event_photos")
    .select("id, url")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) return { error: "That photograph is not there any more." };

  const { data: gone, error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", photoId)
    .select("id");

  if (error) return { error: "That could not be taken down." };

  if (!gone || gone.length === 0) {
    return { error: "Only whoever posted it, or an admin, can take it down." };
  }

  // And the file itself. Deleting the row left the image on a public
  // URL for ever, so Take it down did not take it down: anybody who had
  // the address, or a screenshot of the page, still had the photograph.
  // 0031 promises a member we remove their picture when they ask.
  if (photo.url) {
    const marker = "/storage/v1/object/public/";
    const at = photo.url.indexOf(marker);
    if (at >= 0) {
      const rest = photo.url.slice(at + marker.length);
      const slash = rest.indexOf("/");
      if (slash > 0) {
        const bucket = rest.slice(0, slash);
        const path = decodeURIComponent(rest.slice(slash + 1).split("?")[0]);
        await supabase.storage.from(bucket).remove([path]);
      }
    }
  }

  revalidatePath(`/events/${String(formData.get("slug"))}`);
  revalidatePath("/photos");
  return {};
}