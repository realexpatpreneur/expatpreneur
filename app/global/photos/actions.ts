"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";

export type PhotoState = { error?: string; done?: string };

export async function savePhotoUse(
  _prev: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const row = {
    who: String(formData.get("who") ?? "").trim(),
    profile_id: String(formData.get("profile_id") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    appears_on: String(formData.get("appears_on") ?? "").trim(),
    taken_on: String(formData.get("taken_on") ?? "") || null,
    consent: String(formData.get("consent") ?? "waiting"),
    consent_note: String(formData.get("consent_note") ?? "").trim() || null,
    review_by: String(formData.get("review_by") ?? "") || null,
  };

  if (!row.who || !row.appears_on) {
    return { error: "Who is in it and where it appears are both needed." };
  }

  const { error } = id
    ? await supabase.from("photo_uses").update(row).eq("id", id)
    : await supabase.from("photo_uses").insert(row);

  if (error) return { error: error.message };

  await record(admin.userId, "photo.recorded", "photo", id || null, {
    appears_on: row.appears_on,
  });

  revalidatePath("/global/photos");
  return { done: "saved" };
}

// Taking a photograph down, which a member can ask for at any time.
export async function retirePhoto(
  _prev: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("photo_uses")
    .update({
      retired_at: new Date().toISOString(),
      consent_note: String(formData.get("reason") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await record(admin.userId, "photo.retired", "photo", id, {});

  revalidatePath("/global/photos");
  return { done: "saved" };
}

export async function saveRotation(
  _prev: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  await requireGlobal();
  const supabase = await createClient();

  for (const [key, field] of [
    ["photo_rotation", "rotation"],
    ["photo_next", "next"],
    ["photo_checked_by", "checked_by"],
  ]) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value: String(formData.get(field) ?? "") }, { onConflict: "key" });
    if (error) return { error: error.message };
  }

  revalidatePath("/global/photos");
  return { done: "saved" };
}