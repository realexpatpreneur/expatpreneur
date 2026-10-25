"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

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

  // An introduction is for the Village you are in, not the network.
  const kind = String(formData.get("kind") ?? "ask");
  const reach =
    kind === "introduction" ? "village" : String(formData.get("reach") ?? "village");

  const { error } = await supabase.from("asks").insert({
    author_id: user.id,
    kind,
    reach,
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

  // Up to three people, by identifier rather than by name typed into
  // the text, so a name spelled two ways still reaches one person.
  const mentions = formData
    .getAll("mentions")
    .map(String)
    .filter(Boolean)
    .slice(0, 3);

  const { error } = await supabase
    .from("ask_replies")
    .insert({ ask_id: askId, author_id: user.id, body, mentions });

  if (error) {
    return {
      error:
        "That reply was refused. Replying to a member in another Village is part of Village Membership.",
    };
  }

  const [{ data: ask }, { data: me }] = await Promise.all([
    supabase.from("asks").select("author_id, title").eq("id", askId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (ask && ask.author_id !== user.id) {
    await notify(
      ask.author_id,
      "reply",
      `${me?.full_name ?? "A member"} answered your post`,
      ask.title,
      `/village/${askId}`
    );
  }

  // The people the reply points at hear about it too. The author of the
  // post is told once, above, and not twice.
  for (const who of mentions) {
    if (who === user.id || who === ask?.author_id) continue;
    await notify(
      who,
      "mention",
      `${me?.full_name ?? "A member"} thinks you two should meet`,
      ask?.title ?? null,
      `/village/${askId}`
    );
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