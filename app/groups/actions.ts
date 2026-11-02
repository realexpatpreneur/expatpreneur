"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

export type JoinState = { error?: string; done?: string };

// Joining tells the lead. The forms said "You are in. The lead will
// share the WhatsApp group." and "the lead will be in touch about the
// first meeting" while neither action told anybody anything, so the lead
// found out by opening the page and counting.
//
// The service connection, because a member cannot read another member's
// name and does not need to in order to be announced to their lead.
async function tellTheLead(
  kind: "group" | "pod",
  table: "industry_groups" | "pods",
  id: string,
  joinerId: string,
  slug: string
) {
  try {
    const service = createAdminClient();
    const [{ data: thing }, { data: joiner }] = await Promise.all([
      service.from(table).select("name, lead_id").eq("id", id).maybeSingle(),
      service.from("profiles").select("full_name").eq("id", joinerId).maybeSingle(),
    ]);

    if (!thing?.lead_id || thing.lead_id === joinerId) return;

    await notify(
      thing.lead_id,
      kind,
      `${joiner?.full_name ?? "Somebody"} joined ${thing.name}`,
      kind === "group"
        ? "They are waiting on the group link."
        : "They are waiting to hear about the first meeting.",
      `/${kind === "group" ? "groups" : "pods"}/${slug}`
    );
  } catch {
    // Joining worked. Not telling the lead is not worth undoing it for.
  }
}

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

  const groupId = String(formData.get("group_id"));
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, profile_id: user.id });

  if (error) return { error: "You are already in this Group." };

  await tellTheLead("group", "industry_groups", groupId, user.id, slug);

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

  await tellTheLead("pod", "pods", podId, user.id, slug);

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