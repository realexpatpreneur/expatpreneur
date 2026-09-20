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

  const { error } = id
    ? await supabase.from("resources").update(row).eq("id", id)
    : await supabase.from("resources").insert({ ...row, created_by: admin.userId });

  if (error) return { error: error.message };

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
  };

  const { error } = id
    ? await supabase.from("media_items").update(row).eq("id", id)
    : await supabase
        .from("media_items")
        .insert({ ...row, slug: slugify(title) });

  if (error) {
    return {
      error:
        "That was refused. Watch and Listen is managed by the Global team.",
    };
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?done=1");
}