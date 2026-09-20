"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";
import type { Block } from "@/lib/blocks";

export type PageState = { error?: string; done?: string };

// The editor posts every block's fields at once, named block_0_heading and
// so on, so saving is one action rather than one per block.
function blocksFrom(formData: FormData): Block[] {
  const count = Number(formData.get("block_count") ?? 0);
  const blocks: Block[] = [];

  for (let i = 0; i < count; i += 1) {
    const type = String(formData.get(`block_${i}_type`) ?? "");
    if (!type || formData.get(`block_${i}_remove`)) continue;

    const field = (name: string) =>
      String(formData.get(`block_${i}_${name}`) ?? "").trim();

    if (type === "hero") {
      blocks.push({
        type,
        heading: field("heading"),
        text: field("text"),
        button_label: field("button_label"),
        button_href: field("button_href"),
        second_label: field("second_label"),
        second_href: field("second_href"),
        image_url: field("image_url"),
      });
    } else if (type === "heading") {
      blocks.push({ type, heading: field("heading") });
    } else if (type === "text") {
      blocks.push({ type, body: field("body") });
    } else if (type === "villages") {
      blocks.push({ type, show: field("show") || "Open and launching Villages" });
    } else if (type === "story") {
      blocks.push({ type, heading: field("heading"), body: field("body") });
    }
  }

  return blocks;
}

export async function savePage(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const publish = String(formData.get("intent")) === "publish";

  const { error } = await supabase
    .from("pages")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      path: String(formData.get("path") ?? "").trim(),
      search_title: String(formData.get("search_title") ?? "").trim() || null,
      search_description:
        String(formData.get("search_description") ?? "").trim() || null,
      blocks: blocksFrom(formData),
      status: publish ? "live" : "draft",
      updated_by: admin.userId,
    })
    .eq("slug", slug);

  if (error) return { error: error.message };

  await record(admin.userId, publish ? "page.published" : "page.saved", "page", null, {
    slug,
  });

  revalidatePath("/global/content");
  revalidatePath("/");
  redirect(`/global/content/${slug}?done=${publish ? "published" : "saved"}`);
}

export async function addBlock(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const type = String(formData.get("type") ?? "text");

  const { data: page } = await supabase
    .from("pages")
    .select("blocks")
    .eq("slug", slug)
    .maybeSingle();

  const blocks = [...(((page?.blocks ?? []) as Block[]) || []), { type } as Block];

  const { error } = await supabase
    .from("pages")
    .update({ blocks, updated_by: admin.userId })
    .eq("slug", slug);

  if (error) return { error: error.message };

  revalidatePath(`/global/content/${slug}`);
  redirect(`/global/content/${slug}`);
}

export async function setPageStatus(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("pages")
    .update({ status, updated_by: admin.userId })
    .eq("slug", slug);

  if (error) return { error: error.message };

  await record(admin.userId, `page.${status}`, "page", null, { slug });

  revalidatePath("/global/content");
  revalidatePath("/");
  return { done: "saved" };
}