"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";

export type MenuState = { error?: string; done?: boolean };

export type MenuRow = {
  id?: string;
  menu: string;
  label: string;
  href: string;
  position: number;
  new_tab?: boolean;
  signed_in?: string;
};

// The whole menu arrives at once, so removing an item is simply not
// sending it.
export async function saveMenu(menu: string, rows: MenuRow[]): Promise<MenuState> {
  await requireGlobal();
  const supabase = await createClient();

  const clean = rows
    .filter((r) => r.label.trim() && r.href.trim())
    .map((r, i) => ({
      id: r.id,
      menu,
      label: r.label.trim(),
      href: r.href.trim(),
      position: i + 1,
      new_tab: Boolean(r.new_tab),
      signed_in: r.signed_in ?? "anyone",
      updated_at: new Date().toISOString(),
    }));

  const keep = clean.map((r) => r.id).filter(Boolean) as string[];

  // Anything that was in this menu and is not in what arrived has gone.
  let gone = supabase.from("menu_items").delete().eq("menu", menu);
  if (keep.length) gone = gone.not("id", "in", `(${keep.join(",")})`);
  const { error: removed } = await gone;
  if (removed) return { error: removed.message };

  if (clean.length) {
    const { error } = await supabase
      .from("menu_items")
      .upsert(clean.map((r) => (r.id ? r : { ...r, id: undefined })));
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/global/menus");
  return { done: true };
}