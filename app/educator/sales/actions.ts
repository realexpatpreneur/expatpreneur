"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { sendEmailToMember, sendEmail, url } from "@/lib/email";

export type SalesState = { error?: string; done?: string };

// An educator writing to the people who bought a course. It goes to
// members through their preferences, and to outside buyers by email,
// because that is the only address we have for them.
export async function messageLearners(
  _prev: SalesState,
  formData: FormData
): Promise<SalesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const courseId = String(formData.get("course_id"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) return { error: "A subject and a message are needed." };

  const service = createAdminClient();
  const { data: course } = await service
    .from("courses")
    .select("id, slug, title, educator_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.educator_id !== user.id) {
    return { error: "That is not your course." };
  }

  const { data: buyers } = await service
    .from("course_purchases")
    .select("profile_id, guest_email, guest_name")
    .eq("course_id", courseId)
    .eq("status", "paid");

  for (const buyer of buyers ?? []) {
    if (buyer.profile_id) {
      await notify(
        buyer.profile_id,
        "learning",
        subject,
        body.slice(0, 120),
        `/learning/${course.slug}`
      );

      const { data: person } = await service
        .from("profiles")
        .select("email")
        .eq("id", buyer.profile_id)
        .maybeSingle();

      await sendEmailToMember(
        buyer.profile_id,
        "messages",
        person?.email ?? null,
        subject,
        subject,
        [body],
        { label: "Open the course", href: url(`/learning/${course.slug}`) }
      );
    } else if (buyer.guest_email) {
      await sendEmail(buyer.guest_email, subject, subject, [body], {
        label: "About this course",
        href: url(`/learning/${course.slug}`),
      });
    }
  }

  revalidatePath("/educator/sales");
  return { done: `Sent to ${(buyers ?? []).length}` };
}