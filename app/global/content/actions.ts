"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";
import { blockSpec, type Block } from "@/lib/blocks";

export type PageState = { error?: string; done?: string | boolean };

// The editor posts every block's fields at once, named block_0_heading and
// so on, so saving is one action rather than one per block.
function blocksFrom(formData: FormData): Block[] {
  const count = Number(formData.get("block_count") ?? 0);
  const rows: { pos: number; block: Block }[] = [];

  // Every block keeps whatever fields its type declares, so adding a
  // block type to the catalogue needs no change here.
  for (let i = 0; i < count; i += 1) {
    const type = String(formData.get(`block_${i}_type`) ?? "");
    if (!type || formData.get(`block_${i}_remove`)) continue;

    const spec = blockSpec(type);
    if (!spec) continue;

    const block: Block = { type };
    for (const f of spec.fields) {
      const v = String(formData.get(`block_${i}_${f.name}`) ?? "").trim();
      if (v) block[f.name] = v;
    }

    const pos = Number(formData.get(`block_${i}_pos`) ?? i + 1);
    rows.push({ pos: Number.isFinite(pos) ? pos : i + 1, block });
  }

  // The position boxes decide the order. Equal numbers keep the order
  // they were already in.
  const blocks = rows
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => a.pos - b.pos || a.i - b.i)
    .map((r) => r.block);

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


// The builder holds the blocks in the browser and sends the finished
// list, so there is no field naming to keep in step.
export async function saveBlocks({
  slug,
  blocks,
  status,
}: {
  slug: string;
  blocks: Block[];
  status: string;
}): Promise<PageState> {
  await requireGlobal();
  const supabase = await createClient();

  const clean = blocks
    .filter((b) => b && b.type && blockSpec(b.type))
    .map((b) => {
      const spec = blockSpec(b.type)!;
      const out: Block = { type: b.type };
      // A container carries its children, which the catalogue does not
      // list as a field.
      if (b.kids) out.kids = b.kids;
      for (const f of spec.fields) {
        const v = String(b[f.name] ?? "").trim();
        if (v) out[f.name] = v;
        // A colour of their own is kept alongside the choice.
        const own = String(b[`${f.name}_custom`] ?? "").trim();
        if (own) out[`${f.name}_custom`] = own;
      }
      return out;
    });

  const { error } = await supabase
    .from("pages")
    .update({
      blocks: clean,
      status: status === "live" ? "live" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) return { error: error.message };

  revalidatePath("/global/content");
  revalidatePath(`/global/content/${slug}`);
  revalidatePath("/", "layout");
  return { done: true };
}