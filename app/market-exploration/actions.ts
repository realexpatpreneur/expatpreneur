"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

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

  const [{ data: post }, { data: me }] = await Promise.all([
    supabase
      .from("market_posts")
      .select("author_id, title")
      .eq("id", postId)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (post && post.author_id !== user.id) {
    await notify(
      post.author_id,
      "reply",
      `${me?.full_name ?? "A member"} answered your market question`,
      post.title,
      `/market-exploration/${postId}`
    );
  }

  revalidatePath(`/market-exploration/${postId}`);
  return {};
}

// The person who asked says it is done, so the board stays honest.
export async function closeMarketPost(
  _prev: MarketState,
  formData: FormData
): Promise<MarketState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/market-exploration");

  const postId = String(formData.get("post_id"));

  const { error } = await supabase
    .from("market_posts")
    .update({
      status: "resolved",
      outcome: String(formData.get("outcome") ?? "").trim() || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: "Only the person who asked can close it." };

  revalidatePath(`/market-exploration/${postId}`);
  return {};
}