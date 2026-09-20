"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LearningState = { error?: string; done?: string };

export async function enrol(
  _prev: LearningState,
  formData: FormData
): Promise<LearningState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/learning/${slug}`);

  const { error } = await supabase
    .from("enrolments")
    .insert({ course_id: String(formData.get("course_id")), profile_id: user.id });

  if (error) {
    return {
      error:
        "That course is not open to you. Some are part of the paid plan.",
    };
  }

  revalidatePath(`/learning/${slug}`);
  return { done: "enrolled" };
}

export async function markLesson(
  _prev: LearningState,
  formData: FormData
): Promise<LearningState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/learning/${slug}`);

  const lessonId = String(formData.get("lesson_id"));
  const done = formData.get("done") === "1";

  if (done) {
    await supabase
      .from("lesson_progress")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("lesson_progress")
      .insert({ lesson_id: lessonId, profile_id: user.id });

    // Finishing the last lesson finishes the course.
    const courseId = String(formData.get("course_id"));
    const [{ count: total }, { data: mine }] = await Promise.all([
      supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
      supabase
        .from("lesson_progress")
        .select("lesson_id, lessons!inner(course_id)")
        .eq("profile_id", user.id)
        .eq("lessons.course_id", courseId),
    ]);

    if (total && (mine ?? []).length >= total) {
      await supabase
        .from("enrolments")
        .update({ completed_at: new Date().toISOString() })
        .eq("course_id", courseId)
        .eq("profile_id", user.id);
    }
  }

  revalidatePath(`/learning/${slug}`);
  return {};
}