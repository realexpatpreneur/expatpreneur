"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MarketState = { error?: string };

export async function createMarketPost(
  _prev: MarketState,
  formData: FormData
): Promise<MarketState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/market-exploration/new");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();

  if (!title || !body || !country || !industry) {
    return { error: "Title, industry, country and the detail are all needed." };
  }

  const { error } = await supabase.from("market_posts").insert({
    author_id: user.id,
    title,
    body,
    industry,
    country,
    city: String(formData.get("city") ?? "").trim() || null,
    stage: String(formData.get("stage") ?? "exploring"),
  });

  if (error) return { error: error.message };

  revalidatePath("/market-exploration");
  redirect("/market-exploration");
}

export async function replyToMarketPost(
  _prev: MarketState,
  formData: FormData
): Promise<MarketState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/market-exploration");

  const postId = String(formData.get("post_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a line or two first." };

  const { error } = await supabase
    .from("market_replies")
    .insert({ post_id: postId, author_id: user.id, body });

  if (error) {
    return {
      error:
        "That reply was refused. Answering a member in another Village is part of the paid plan.",
    };
  }

  revalidatePath(`/market-exploration/${postId}`);
  return {};
}