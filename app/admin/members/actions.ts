"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { sendEmailToMember, sendTemplate, url } from "@/lib/email";
import { record } from "@/lib/audit";
import { notify } from "@/lib/notify";

export type MemberAdminState = { error?: string };

export async function updateMember(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const circleId = String(formData.get("circle_id") || "") || null;

  const { data: before } = await supabase
    .from("profiles")
    .select("circle_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      circle_id: circleId,
      status: String(formData.get("status") ?? "active"),
      plan: String(formData.get("plan") ?? "member"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await record(admin.userId, "member.updated", "profile", id, {
    circle_id: circleId,
    status: String(formData.get("status") ?? "active"),
    plan: String(formData.get("plan") ?? "member"),
  });

  // Moving someone between Circles means the WhatsApp groups change too.
  if (circleId && before?.circle_id !== circleId) {
    const { data: circle } = await supabase
      .from("circles")
      .select("name, village_id")
      .eq("id", circleId)
      .maybeSingle();

    await supabase.from("whatsapp_tasks").insert({
      village_id: circle?.village_id ?? admin.homeVillageId,
      profile_id: id,
      kind: before?.circle_id ? "move" : "add",
      group_name: circle?.name ?? "Village group",
    });

    // And the member is told, which until now they were not. This is
    // the moment somebody actually joins: before a Circle they are a
    // name in a list.
    const { data: person } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", id)
      .maybeSingle();

    await notify(
      id,
      "announcement",
      before?.circle_id ? "You have moved Circle" : "You are in a Circle",
      `${circle?.name ?? "Your Circle"} is your home base.`,
      "/my-circle"
    );

    await sendTemplate(
      "circle",
      person?.email ?? null,
      {
        name: (person?.full_name ?? "there").split(" ")[0],
        circle: circle?.name ?? "your Circle",
        link: url("/my-circle"),
      },
      {
        subject: before?.circle_id
          ? `You have moved to ${circle?.name ?? "a new Circle"}`
          : `You are in ${circle?.name ?? "a Circle"}`,
        title: circle?.name ?? "Your Circle",
        lines: [
          before?.circle_id
            ? "Your Local Admin has moved you, and the WhatsApp groups will follow within a day or so."
            : "This is your home base: up to fifty members who meet, ask and answer each other.",
          "Your Local Admin adds you to the WhatsApp group by hand, so give it a day.",
        ],
        action: { label: "Open your Circle", href: url("/my-circle") },
      },
      { profileId: id, kind: "announcements" }
    );
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${id}?done=1`);
}

export async function saveCircle(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const row = {
    name: String(formData.get("name") ?? "").trim(),
    whatsapp_url: String(formData.get("whatsapp_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "preparing"),
  };

  if (!row.name) return { error: "A Circle needs a name." };

  if (id) {
    const { error } = await supabase.from("circles").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const villageId =
      String(formData.get("village_id") ?? "") ||
      admin.homeVillageId ||
      admin.villageIds[0];
    const { error } = await supabase
      .from("circles")
      .insert({ ...row, village_id: villageId });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/circles");
  redirect("/admin/circles?done=1");
}

export async function completeWhatsappTask(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_tasks")
    .update({ done_at: new Date().toISOString(), done_by: admin.userId })
    .eq("id", String(formData.get("task_id")));

  if (error) return { error: error.message };

  revalidatePath("/admin/whatsapp");
  return {};
}

export async function sendAnnouncement(
  _prev: MemberAdminState,
  formData: FormData
): Promise<MemberAdminState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "A title and the message are needed." };

  const { error } = await supabase.from("announcements").insert({
    village_id: admin.homeVillageId ?? admin.villageIds[0] ?? null,
    author_id: admin.userId,
    audience: String(formData.get("audience") ?? "village"),
    title,
    body,
    sent_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Everyone active in the Village hears it once, on the platform and by
  // email.
  const villageId = admin.homeVillageId ?? admin.villageIds[0] ?? null;
  const { data: members } = villageId
    ? await supabase
        .from("member_records")
        .select("id, email, full_name")
        .eq("village_id", villageId)
        .eq("status", "active")
    : { data: [] };

  for (const member of members ?? []) {
    await notify(member.id, "announcement", title, body.slice(0, 120), "/home");
    await sendEmailToMember(
      member.id,
      "announcements",
      member.email,
      title,
      title,
      [body],
      { label: "Open the platform", href: url("/home") }
    );
  }

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements?done=1");
}