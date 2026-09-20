"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/events";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export type BusinessState = { error?: string };

export async function saveBusiness(
  _prev: BusinessState,
  formData: FormData
): Promise<BusinessState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/businesses");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "The business needs a name." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const id = String(formData.get("id") ?? "");
  const row = {
    name,
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    services: String(formData.get("services") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    offer: String(formData.get("offer") ?? "").trim() || null,
    founded: String(formData.get("founded") ?? "").trim() || null,
    serves: list(formData.get("serves")),
    public: Boolean(formData.get("public")),
    village_id: profile?.village_id ?? null,
  };

  const { error } = id
    ? await supabase.from("businesses").update(row).eq("id", id)
    : await supabase
        .from("businesses")
        .insert({ ...row, owner_id: user.id, slug: slugify(name) });

  if (error) return { error: error.message };

  revalidatePath("/businesses");
  redirect("/businesses?done=1");
}

export type JobState = { error?: string };

export async function saveJob(
  _prev: JobState,
  formData: FormData
): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) {
    return { error: "A title and a description are needed." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("jobs").insert({
    poster_id: user.id,
    business_id: String(formData.get("business_id") ?? "") || null,
    village_id: profile?.village_id ?? null,
    reach: String(formData.get("reach") ?? "village"),
    kind: String(formData.get("kind") ?? "job"),
    title,
    description,
    location: String(formData.get("location") ?? "").trim() || null,
    remote: Boolean(formData.get("remote")),
    compensation: String(formData.get("compensation") ?? "").trim() || null,
    apply_note: String(formData.get("apply_note") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/jobs");
  redirect("/jobs?done=1");
}

export async function closeJob(
  _prev: JobState,
  formData: FormData
): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs");

  const id = String(formData.get("job_id"));
  const { error } = await supabase
    .from("jobs")
    .update({ status: String(formData.get("status") ?? "filled") })
    .eq("id", id)
    .eq("poster_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${id}`);
  return {};
}