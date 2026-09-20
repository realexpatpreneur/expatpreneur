"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { slugify } from "@/lib/events";

export type PathwayAdminState = { error?: string };

export async function savePathway(
  _prev: PathwayAdminState,
  formData: FormData
): Promise<PathwayAdminState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!title || !country) return { error: "A title and a country are needed." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    country,
    city: String(formData.get("city") ?? "").trim() || null,
    summary: String(formData.get("summary") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    tier: String(formData.get("tier") ?? "all"),
    status: String(formData.get("status") ?? "draft"),
  };

  const { data, error } = id
    ? await supabase.from("market_pathways").update(row).eq("id", id).select("slug").maybeSingle()
    : await supabase
        .from("market_pathways")
        .insert({ ...row, owner_id: admin.userId, slug: slugify(`${country}-${title}`) })
        .select("slug")
        .maybeSingle();

  if (error) return { error: error.message };

  revalidatePath("/global/markets");
  redirect(`/global/markets/${data?.slug}?done=1`);
}

export async function saveStep(
  _prev: PathwayAdminState,
  formData: FormData
): Promise<PathwayAdminState> {
  await requireGlobal();
  const supabase = await createClient();

  const pathwayId = String(formData.get("pathway_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A step needs a title." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    watch_out: String(formData.get("watch_out") ?? "").trim() || null,
    link: String(formData.get("link") ?? "").trim() || null,
    typical_cost: String(formData.get("typical_cost") ?? "").trim() || null,
    typical_time: String(formData.get("typical_time") ?? "").trim() || null,
    position: Number(formData.get("position") ?? 1),
  };

  const { error } = id
    ? await supabase.from("pathway_steps").update(row).eq("id", id)
    : await supabase.from("pathway_steps").insert({ ...row, pathway_id: pathwayId });

  if (error) {
    return { error: "Two steps cannot share a position in the same pathway." };
  }

  const { data: pathway } = await supabase
    .from("market_pathways")
    .select("slug")
    .eq("id", pathwayId)
    .maybeSingle();

  revalidatePath(`/global/markets/${pathway?.slug}`);
  redirect(`/global/markets/${pathway?.slug}?done=1`);
}