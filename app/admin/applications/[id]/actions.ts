"use server";

import { revalidatePath } from "next/cache";
import { siteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/access";
import { sendEmail, sendTemplate, url } from "@/lib/email";

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

// Approving sends the invitation and makes the record. It no longer
// opens the door. The Circle the admin chooses is remembered on the
// application and given when the payment completes, which is the order
// her framework sets out: approved, invited, account, payment, member.
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

  // The balance limit. 0084 made it real, so this asks before writing
  // rather than letting the trigger raise, which lets a Local Admin be
  // told what to do about it. The trigger is still there behind this.
  const clearIt = formData.get("over_the_limit") === "on";
  const service0 = createAdminClient();
  const { data: over } = await service0.rpc("nationality_over_the_limit", {
    p_village: application.village_id,
    p_nationalities: application.nationalities ?? [],
  });

  if (over && !(admin.isGlobal && clearIt)) {
    return {
      error: admin.isGlobal
        ? `Approving this would put ${over} above the balance limit for this Village. Tick the box to approve it anyway and it will be recorded against your name.`
        : `Approving this would put ${over} above the balance limit for this Village. Recommend it to the Global team and they will decide.`,
    };
  }

  // Their own words about what they need and what they offer, carried
  // onto the profile only if they said the Village could see them. The
  // introduction they find waiting is built from these.
  const answers = (application.answers ?? {}) as Record<string, unknown>;
  const shared = String(answers.share_answers ?? "") === "Yes";
  const lookingFor = shared ? String(answers.looking_for ?? "").trim() : "";
  const canHelpWith = shared ? String(answers.can_help_with ?? "").trim() : "";

  const service = createAdminClient();
  const site = siteUrl;

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
      // The Circle waits for the payment. So does the status: 'invited'
      // is outside is_member(), so the private side stays shut without
      // any rule having to be changed.
      status: "invited",
      plan: "member",
      industry: application.industry,
      business_name: application.business_name,
      looking_for: lookingFor || null,
      can_help_with: canHelpWith || null,
      nationalities: application.nationalities ?? [],
      languages: application.languages ?? [],
      joined_on: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "id" }
  );
  if (profileError) return { error: profileError.message };

  // The offer of a place stands for fourteen days. After that they ask
  // for another link rather than filling the form in again.
  const invitedAt = new Date();
  const invitedUntil = new Date(invitedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

  await service
    .from("applications")
    .update({
      status: "approved",
      decided_by: admin.userId,
      decided_at: invitedAt.toISOString(),
      ...(over
        ? {
            nationality_cleared_by: admin.userId,
            nationality_cleared_at: invitedAt.toISOString(),
          }
        : {}),
      profile_id: userId,
      circle_id: circleId,
      invited_at: invitedAt.toISOString(),
      invite_expires_at: invitedUntil.toISOString(),
      invites_sent: (application.invites_sent ?? 0) + 1,
    })
    .eq("id", id);

  // The WhatsApp task waits for the payment too. Adding somebody to the
  // Circle group before they have joined would put them in a room they
  // are not yet in, and taking them back out is worse than never having
  // added them. The webhook raises it when the money clears.

  // The template wants the Village and the names of its Local Admins.
  const { data: village } = application.village_id
    ? await service
        .from("villages")
        .select("name")
        .eq("id", application.village_id)
        .maybeSingle()
    : { data: null };

  const villageName = village?.name ?? null;

  const { data: adminRoles } = application.village_id
    ? await service
        .from("member_roles")
        .select("profile_id")
        .eq("role", "local_admin")
        .eq("scope_id", application.village_id)
        .is("ended_at", null)
    : { data: [] };

  const { data: adminPeople } = (adminRoles ?? []).length
    ? await service
        .from("profiles")
        .select("full_name")
        .in("id", (adminRoles ?? []).map((r) => r.profile_id))
    : { data: [] };

  const adminNames = (adminPeople ?? [])
    .map((p) => p.full_name.split(" ")[0])
    .join(" and ");

  await service.from("audit_log").insert({
    actor_id: admin.userId,
    action: "application.approved",
    entity: "applications",
    entity_id: id,
    meta: { profile_id: userId, circle_id: circleId },
  });

  await sendTemplate(
    "approved",
    application.email,
    {
      first_name: String(application.full_name).split(" ")[0],
      village: villageName ?? "your",
      local_admins: adminNames || "Your Local Admins",
    },
    {
      subject: "You are in",
      title: "Welcome to ExpatPreneurs",
      lines: [
        `Your request has been approved, ${String(application.full_name).split(" ")[0]}.`,
        "A separate email carries the link that signs you in. Open it, finish your profile, and your Circle can find you.",
        "If it has not arrived, look in spam before writing to us.",
      ],
      action: { label: "Go to the platform", href: url("/login") },
    }
  );

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

  const { data: application, error } = await supabase
    .from("applications")
    .update({ status: "waitlisted", local_note: note, reviewed_by: admin.userId })
    .eq("id", id)
    .select("full_name, email, village_id")
    .maybeSingle();
  if (error) return { error: error.message };

  if (application) {
    const { data: village } = application.village_id
      ? await supabase
          .from("villages")
          .select("name")
          .eq("id", application.village_id)
          .maybeSingle()
      : { data: null };

    await sendTemplate(
      "waitlisted",
      application.email,
      {
        first_name: String(application.full_name).split(" ")[0],
        village: village?.name ?? "your",
      },
      {
        subject: "Your request, and where it stands",
        title: "Not yet, but not no",
        lines: [
          `Thank you for asking, ${String(application.full_name).split(" ")[0]}.`,
          "Your Village is at capacity for now, so your request is on the list rather than declined. When the next Circle opens, we come back to this list first.",
        ],
        action: { label: "See the Villages", href: url("/villages") },
      }
    );
  }

  // Nothing recorded this. /global/settings says "Every decision a
  // leader makes is recorded" and /global/audit already has a label for
  // this exact action, waiting for a record that never arrived.
  await createAdminClient().from("audit_log").insert({
    actor_id: admin.userId,
    action: "application.waitlisted",
    entity: "applications",
    entity_id: id,
    meta: { note: note || null },
  });

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

  const { data: application, error } = await supabase
    .from("applications")
    .update({
      status: "declined",
      decline_reason: reason,
      decided_by: admin.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("full_name, email")
    .maybeSingle();
  if (error) return { error: error.message };

  // The applicant is told the decision, never the reason.
  if (application) {
    await sendTemplate(
      "declined",
      application.email,
      { first_name: String(application.full_name).split(" ")[0] },
      {
        subject: "About your request",
        title: "Not this time",
        lines: [
          `Thank you for asking, ${String(application.full_name).split(" ")[0]}.`,
          "We are not able to offer you a place at the moment. That is a decision about fit and timing, not about your business.",
          "You are welcome to ask again in future, and the public events are open to you meanwhile.",
        ],
      }
    );
  }

  // Same again, and this is the decision most likely to be questioned
  // later, which makes it the worst one to have been leaving out.
  await createAdminClient().from("audit_log").insert({
    actor_id: admin.userId,
    action: "application.declined",
    entity: "applications",
    entity_id: id,
    meta: { reason: reason || null },
  });

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=declined`);
}
// A tricky one goes to the Global team rather than being decided locally.
// /apply/status has always described this stage and nothing could reach
// it until 0084. A Local Admin stopped by the balance limit uses this.
export async function recommendApplication(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .update({ status: "recommended", local_note: note, reviewed_by: admin.userId })
    .eq("id", id)
    .select("full_name, village_id")
    .maybeSingle();
  if (error) return { error: error.message };

  // Somebody has to know it is waiting, or it sits in a queue nobody
  // opens. This is the kind of promise the audit found broken in eleven
  // other places, so it is not going to be broken here.
  if (application) {
    const service = createAdminClient();
    const { data: globals } = await service
      .from("member_roles")
      .select("profile_id")
      .eq("role", "global_admin")
      .is("ended_at", null);

    const { notify } = await import("@/lib/notify");
    for (const person of globals ?? []) {
      await notify(
        person.profile_id,
        "application",
        "A Village has recommended somebody",
        `${application.full_name} is waiting for the final word.`,
        "/admin/applications?stage=recommended"
      );
    }
  }

  revalidatePath("/admin/applications");
  redirect(`/admin/applications/${id}?done=recommended`);
}
