import { createClient } from "@/lib/supabase/server";

export type { Block } from "@/lib/blocks";
import type { Block } from "@/lib/blocks";

export type Page = {
  slug: string;
  title: string;
  path: string;
  blocks: Block[];
  search_title: string | null;
  search_description: string | null;
  status: "draft" | "live";
};

// A live page replaces what is written in code. A draft, or no row at
// all, leaves the page exactly as it was.
export async function livePage(slug: string): Promise<Page | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pages")
      .select("slug, title, path, blocks, search_title, search_description, status")
      .eq("slug", slug)
      .eq("status", "live")
      .maybeSingle();

    return (data as Page) ?? null;
  } catch {
    return null;
  }
}