"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";
import { sendEmail, url, emailReady } from "@/lib/email";

export type EmailState = { error?: string; done?: string };

export async function saveTemplate(
  _prev: EmailState,
  formData: FormData
): Promise<EmailState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const key = String(formData.get("key"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) return { error: "A subject and a body are needed." };

  const { error } = await supabase
    .from("email_templates")
    .update({
      subject,
      body,
      button_label: String(formData.get("button_label") ?? "").trim() || null,
      button_path: String(formData.get("button_path") ?? "").trim() || null,
      active: Boolean(formData.get("active")),
      updated_by: admin.userId,
    })
    .eq("key", key);

  if (error) return { error: error.message };

  await record(admin.userId, "email.edited", "email_template", null, { key });

  revalidatePath("/global/emails");
  redirect(`/global/emails/${key}?done=1`);
}

// Send me a test, as the prototype's button says. It goes to the person
// pressing it, with the placeholders filled in with example values.
export async function sendTestEmail(
  _prev: EmailState,
  formData: FormData
): Promise<EmailState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const key = String(formData.get("key"));

  const [{ data: template }, { data: me }] = await Promise.all([
    supabase
      .from("email_templates")
      .select("subject, body, button_label, button_path")
      .eq("key", key)
      .maybeSingle(),
    supabase
      .from("member_records")
      .select("email, full_name")
      .eq("id", admin.userId)
      .maybeSingle(),
  ]);

  if (!template) return { error: "That template is not there." };
  if (!me?.email) return { error: "No address to send a test to." };

  const example: Record<string, string> = {
    first_name: me.full_name?.split(" ")[0] ?? "Tomas",
    village: "Dubai",
    local_admins: "Nadia and Rahel",
    circle: "Circle 02",
    event: "Founders dinner",
    reference: "EP-7K3M",
    link: url("/home"),
  };

  const fill = (text: string) =>
    Object.entries(example).reduce(
      (out, [name, value]) => out.split(`{${name}}`).join(value),
      text
    );

  // This is the one screen whose purpose is to find out whether email
  // works, and it answered "Sent to your own address" without calling
  // anything that could have sent. sendEmail returns on its first line
  // when there is no key, so the test was reporting its own no-op as a
  // success, on the day somebody would be using it to debug exactly that.
  if (!emailReady) {
    return {
      error:
        "Nothing was sent. There is no Resend key set, so no email leaves the platform yet. Set RESEND_API_KEY and try again.",
    };
  }

  await sendEmail(
    me.email,
    `Test: ${fill(template.subject)}`,
    fill(template.subject),
    fill(template.body).split("\n").filter((line) => line.trim()),
    template.button_label
      ? { label: template.button_label, href: url(template.button_path ?? "/") }
      : undefined
  );

  revalidatePath(`/global/emails/${key}`);
  return { done: "sent" };
}