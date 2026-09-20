"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/events";

export type EducatorState = { error?: string };

// A course belongs to the person teaching it. The database checks that
// again on every write.
export async function saveCourse(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is needed." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    summary: String(formData.get("summary") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    level: String(formData.get("level") ?? "anyone"),
    duration: String(formData.get("duration") ?? "").trim() || null,
    tier: String(formData.get("tier") ?? "all"),
    status: String(formData.get("status") ?? "draft"),
  };

  const { error } = id
    ? await supabase.from("courses").update(row).eq("id", id)
    : await supabase
        .from("courses")
        .insert({ ...row, educator_id: user.id, slug: slugify(title) });

  if (error) {
    return { error: "That was refused. Courses are written by Educators." };
  }

  revalidatePath("/educator");
  redirect("/educator?done=1");
}

export async function saveLesson(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A lesson needs a title." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    duration: String(formData.get("duration") ?? "").trim() || null,
    position: Number(formData.get("position") ?? 1),
  };

  const { error } = id
    ? await supabase.from("lessons").update(row).eq("id", id)
    : await supabase.from("lessons").insert({ ...row, course_id: courseId });

  if (error) {
    return {
      error:
        "That was refused. Two lessons cannot share a position in the same course.",
    };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  revalidatePath(`/educator/${course?.slug}`);
  redirect(`/educator/${course?.slug}?done=1`);
}

export async function deleteLesson(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const courseId = String(formData.get("course_id"));

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) {
    return { error: "Only the educator who wrote it can take it down." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  revalidatePath(`/educator/${course?.slug}`);
  redirect(`/educator/${course?.slug}?done=1`);
}