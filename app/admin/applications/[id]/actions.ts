"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/access";

export type DecisionState = { error?: string };

async function loadApplication(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("That request could not be read.");
  return data;
}

// Approving does four things: it creates the account and sends the
// invitation email, it creates the member profile, it places them in a
// Circle, and it leaves a WhatsApp task so the groups stay in step.
export async function approveApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const circleId = String(formData.get("circle_id") || "") || null;

  const admin = await requireAdmin();
  const application = await loadApplication(id);

  if (
    !admin.isGlobal &&
    application.village_id &&
    !admin.villageIds.includes(application.village_id)
  ) {
    return { error: "That request belongs to another Village." };
  }
  if (!application.village_id) {
    return { error: "Choose a Village for this person before approving." };
  }

  const service = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app";

  const { data: invited, error: inviteError } =
    await service.auth.admin.inviteUserByEmail(application.email, {
      redirectTo: `${site}/auth/callback?next=/home`,
    });

  let userId = invited?.user?.id;

  if (inviteError) {
    // Already has an account, which happens when someone applies twice.
    const { data: list } = await service.auth.admin.listUsers();
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === String(application.email).toLowerCase()
    );
    if (!existing) return { error: inviteError.message };
    userId = existing.id;
  }

  if (!userId) return { error: "The account could not be created." };

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: userId,
      full_name: application.full_name,
      email: application.email,
      phone: application.phone,
      village_id: application.village_id,
      circle_id: circleId,
      status: "onboarding",
      plan: "member",
      industry: application.industry,
      business_name: application.business_name,
      nationalities: application.nationalities ?? [],
      languages: application.languages ?? [],
      joined_on: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "id" }
  );
  if (profileError) return { error: profileError.message };

  await service
    .from("applications")
    .update({
      status: "approved",
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
      profile_id: userId,
    })
    .eq("id", id);

  if (circleId) {
    const { data: circle } = await service
      .from("circles")
      .select("name")
      .eq("id", circleId)
      .maybeSingle();
    await service.from("whatsapp_tasks").insert({
      village_id: application.village_id,
      profile_id: userId,
      kind: "add",
      group_name: circle?.name ?? "Village group",
    });
  }

  await service.from("audit_log").insert({
    actor_id: admin.userId,
    action: "application.approved",
    entity: "applications",
    entity_id: id,
    meta: { profile_id: userId, circle_id: circleId },
  });

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=approved`);
}

export async function waitlistApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "");
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({ status: "waitlisted", local_note: note, reviewed_by: admin.userId })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=waitlisted`);
}

export async function declineApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  if (!reason.trim()) {
    return { error: "A reason is needed, so the decision can be reviewed." };
  }

  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({
      status: "declined",
      decline_reason: reason,
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=declined`);
}