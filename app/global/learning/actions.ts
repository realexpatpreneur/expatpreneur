"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type ReviewState = { error?: string };

// Nothing reaches members until somebody has read it. The educator writes
// it; the Global team decides whether it goes out.
export async function reviewCourse(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("course_id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim() || null;

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, educator_id")
    .eq("id", id)
    .maybeSingle();

  if (!course) return { error: "That course is not there any more." };

  const { error } = await supabase
    .from("courses")
    .update({
      review: decision,
      review_note: note,
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (course.educator_id) {
    await notify(
      course.educator_id,
      "learning",
      decision === "approved"
        ? `Approved: ${course.title}`
        : `Not yet: ${course.title}`,
      decision === "approved"
        ? "It is open to members now."
        : note ?? "There is a note on it.",
      `/educator/${course.slug}`
    );
  }

  await record(admin.userId, `course.${decision}`, "course", id, {
    title: course.title,
  });

  revalidatePath("/global/learning");
  return {};
}