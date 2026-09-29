import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type MenuItem = {
  label: string;
  href: string;
  new_tab?: boolean;
  signed_in?: string;
};

// A menu from the database, or nothing, in which case whatever calls
// this keeps the menu written in the code.
export const menu = cache(async function menu(name: string): Promise<MenuItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("menu_items")
      .select("label, href, new_tab, signed_in")
      .eq("menu", name)
      .order("position");
    return data ?? [];
  } catch {
    return [];
  }
});

// Whether an item should be shown to this person.
export const forWho = (items: MenuItem[], signedIn: boolean) =>
  items.filter(
    (i) =>
      !i.signed_in ||
      i.signed_in === "anyone" ||
      (i.signed_in === "members") === signedIn
  );