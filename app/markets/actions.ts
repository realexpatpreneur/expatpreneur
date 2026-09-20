"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PathwayState = { error?: string; done?: string };

export async function followPathway(
  _prev: PathwayState,
  formData: FormData
): Promise<PathwayState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/markets/${slug}`);

  const { error } = await supabase.from("pathway_followers").insert({
    pathway_id: String(formData.get("pathway_id")),
    profile_id: user.id,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) {
    return {
      error:
        "That pathway is not open to you. Some are part of the paid plan.",
    };
  }

  revalidatePath(`/markets/${slug}`);
  return { done: "following" };
}

export async function markStep(
  _prev: PathwayState,
  formData: FormData
): Promise<PathwayState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/markets/${slug}`);

  const stepId = String(formData.get("step_id"));

  if (formData.get("done") === "1") {
    await supabase
      .from("pathway_step_progress")
      .delete()
      .eq("step_id", stepId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("pathway_step_progress")
      .insert({ step_id: stepId, profile_id: user.id });
  }

  revalidatePath(`/markets/${slug}`);
  return {};
}