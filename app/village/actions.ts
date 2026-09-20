"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PostState = { error?: string };

// Ask & Offer. A post reaches your own Village, or every Village when the
// member chooses that. The database decides who may reply.
export async function createPost(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/village/new");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A title and a few lines are needed." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("asks").insert({
    author_id: user.id,
    kind: String(formData.get("kind") ?? "ask"),
    reach: String(formData.get("reach") ?? "village"),
    village_id: profile?.village_id ?? null,
    category: String(formData.get("category") ?? "").trim() || null,
    title,
    body,
  });

  if (error) return { error: error.message };

  revalidatePath("/village");
  redirect("/village");
}

export async function replyToPost(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/village");

  const askId = String(formData.get("ask_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a line or two first." };

  const { error } = await supabase
    .from("ask_replies")
    .insert({ ask_id: askId, author_id: user.id, body });

  if (error) {
    return {
      error:
        "That reply was refused. Replying to a member in another Village is part of the paid plan.",
    };
  }

  revalidatePath(`/village/${askId}`);
  return {};
}

export async function closePost(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/village");

  const askId = String(formData.get("ask_id"));
  const outcome = String(formData.get("outcome") ?? "").trim() || null;

  const { error } = await supabase
    .from("asks")
    .update({ status: "resolved", outcome, resolved_at: new Date().toISOString() })
    .eq("id", askId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/village/${askId}`);
  return {};
}