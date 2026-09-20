"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string; done?: string };

export async function joinGroup(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/groups/${slug}`);

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: String(formData.get("group_id")), profile_id: user.id });

  if (error) return { error: "You are already in this Group." };

  revalidatePath(`/groups/${slug}`);
  return { done: "joined" };
}

export async function leaveGroup(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/groups/${slug}`);

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", String(formData.get("group_id")))
    .eq("profile_id", user.id);

  revalidatePath(`/groups/${slug}`);
  return { done: "left" };
}

// A Pod is small on purpose, so the seats are checked before anyone joins.
export async function joinPod(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/pods/${slug}`);

  const podId = String(formData.get("pod_id"));

  const { data: seats } = await supabase
    .from("pod_sizes")
    .select("places_left")
    .eq("pod_id", podId)
    .maybeSingle();

  if ((seats?.places_left ?? 0) <= 0) {
    return { error: "This Pod is full. The next one forms shortly." };
  }

  const { error } = await supabase
    .from("pod_members")
    .insert({ pod_id: podId, profile_id: user.id });

  if (error) return { error: "You are already in this Pod." };

  revalidatePath(`/pods/${slug}`);
  return { done: "joined" };
}

export async function leavePod(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/pods/${slug}`);

  await supabase
    .from("pod_members")
    .delete()
    .eq("pod_id", String(formData.get("pod_id")))
    .eq("profile_id", user.id);

  revalidatePath(`/pods/${slug}`);
  return { done: "left" };
}