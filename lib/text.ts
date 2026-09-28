import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Wording that the Global team can change without a developer.
//
// A page loads its own rows once, then asks for each piece by key with
// the wording from the code as the fallback. If the table is empty, or
// the database is unreachable, every page reads exactly as it does
// today. Nothing can be blanked by publishing.
export type Words = (key: string, fallback: string) => string;

export const pageText = cache(async function pageText(
  page: string
): Promise<Words> {
  let rows: { key: string; value: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("page_text")
      .select("key, value")
      .eq("page", page);
    rows = data ?? [];
  } catch {
    // The page keeps its coded wording.
  }

  const map = new Map(rows.map((r) => [r.key, r.value]));
  return (key: string, fallback: string) => {
    const v = map.get(key);
    return v && v.trim() ? v : fallback;
  };
});