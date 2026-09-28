"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { textPage } from "@/lib/text-keys";

export type WordingState = { error?: string; done?: boolean };

export async function saveWording(
  _prev: WordingState,
  formData: FormData
): Promise<WordingState> {
  const me = await requireGlobal();
  const page = String(formData.get("page") ?? "");
  const spec = textPage(page);
  if (!spec) return { error: "That page is not one we can edit." };

  const supabase = await createClient();

  // A box left empty means "use the wording in the build", so the row
  // is removed rather than saved as an empty string.
  const keep: { page: string; key: string; value: string; updated_by: string }[] = [];
  const drop: string[] = [];

  for (const k of spec.keys) {
    const value = String(formData.get(`v.${k.key}`) ?? "").trim();
    if (value) keep.push({ page, key: k.key, value, updated_by: me.userId });
    else drop.push(k.key);
  }

  if (keep.length) {
    const { error } = await supabase
      .from("page_text")
      .upsert(keep, { onConflict: "page,key" });
    if (error) return { error: error.message };
  }
  if (drop.length) {
    await supabase.from("page_text").delete().eq("page", page).in("key", drop);
  }

  revalidatePath(spec.path);
  revalidatePath("/global/wording");
  return { done: true };
}