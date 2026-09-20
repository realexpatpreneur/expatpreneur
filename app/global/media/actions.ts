"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { slugify } from "@/lib/events";
import { record } from "@/lib/audit";

export type ArticleState = { error?: string };

export async function saveArticle(
  _prev: ArticleState,
  formData: FormData
): Promise<ArticleState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A title and the piece itself are needed." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const row = {
    title,
    body,
    kind: String(formData.get("kind") ?? "story"),
    standfirst: String(formData.get("standfirst") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    about_id: String(formData.get("about_id") ?? "").trim() || null,
    village_id: String(formData.get("village_id") ?? "").trim() || null,
    member_only: Boolean(formData.get("member_only")),
    status,
    // Publishing stamps the date once, and keeps it after that.
    published_at:
      status === "published"
        ? String(formData.get("published_at") || new Date().toISOString())
        : null,
  };

  const { data, error } = id
    ? await supabase.from("articles").update(row).eq("id", id).select("id").maybeSingle()
    : await supabase
        .from("articles")
        .insert({ ...row, slug: slugify(title) })
        .select("id")
        .maybeSingle();

  if (error) return { error: error.message };

  await record(admin.userId, id ? "article.updated" : "article.written", "article", data?.id ?? null, {
    title,
    status,
  });

  revalidatePath("/global/media");
  revalidatePath("/media");
  redirect("/global/media?done=1");
}

export async function handleStorySuggestion(
  _prev: ArticleState,
  formData: FormData
): Promise<ArticleState> {
  await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("story_suggestions")
    .update({
      status: String(formData.get("status") ?? "read"),
      note: String(formData.get("note") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("suggestion_id")));

  if (error) return { error: error.message };

  revalidatePath("/global/media");
  return {};
}