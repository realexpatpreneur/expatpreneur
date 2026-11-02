"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { slugify } from "@/lib/events";

export type LibraryState = { error?: string };

export async function saveResource(
  _prev: LibraryState,
  formData: FormData
): Promise<LibraryState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is needed." };

  const id = String(formData.get("id") ?? "");
  const allVillages = Boolean(formData.get("all_villages"));

  const row = {
    title,
    kind: String(formData.get("kind") ?? "guide"),
    description: String(formData.get("description") ?? "").trim() || null,
    url: String(formData.get("url") ?? "").trim() || null,
    all_villages: allVillages,
    village_id: allVillages
      ? null
      : admin.homeVillageId ?? admin.villageIds[0] ?? null,
  };

  // An update that matches no rows is not an error. resources_write is
  // is_admin(village_id), and the list deliberately shows every
  // all_villages resource to every Local Admin, so one of them editing a
  // network wide resource changed nothing and was told "Saved." Asking
  // for the row back is what turns that into the refusal it is.
  const { data: saved, error } = id
    ? await supabase.from("resources").update(row).eq("id", id).select("id").maybeSingle()
    : await supabase
        .from("resources")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .maybeSingle();

  if (error) return { error: error.message };
  if (!saved) {
    return {
      error:
        "That was refused. Resources for every Village are the Global team's to change.",
    };
  }

  revalidatePath("/admin/resources");
  redirect("/admin/resources?done=1");
}

export async function saveMedia(
  _prev: LibraryState,
  formData: FormData
): Promise<LibraryState> {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is needed." };

  const id = String(formData.get("id") ?? "");
  const publish = Boolean(formData.get("publish"));

  const row = {
    title,
    kind: String(formData.get("kind") ?? "video"),
    summary: String(formData.get("summary") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    external_url: String(formData.get("external_url") ?? "").trim() || null,
    duration: String(formData.get("duration") ?? "").trim() || null,
    member_only: Boolean(formData.get("member_only")),
    published_at: publish ? new Date().toISOString() : null,
    show_slug: String(formData.get("show_slug") ?? "").trim() || null,
    episode_number:
      String(formData.get("episode_number") ?? "").trim() === ""
        ? null
        : Number(formData.get("episode_number")),
  };

  // Same silent success. The page warns a Local Admin that "saving will
  // be refused", and an update matching no rows told them the opposite.
  const { data: savedMedia, error } = id
    ? await supabase.from("media_items").update(row).eq("id", id).select("id").maybeSingle()
    : await supabase
        .from("media_items")
        .insert({ ...row, slug: slugify(title) })
        .select("id")
        .maybeSingle();

  if (error || !savedMedia) {
    return {
      error:
        "That was refused. Watch and Listen is managed by the Global team.",
    };
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?done=1");
}