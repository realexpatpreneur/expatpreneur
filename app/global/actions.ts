"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { sendEmail, url } from "@/lib/email";

export type GlobalState = { error?: string };

export async function saveVillage(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  await requireGlobal();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!name || !city || !country) {
    return { error: "A name, a city and a country are needed." };
  }

  const id = String(formData.get("id") ?? "");
  const row = {
    name,
    city,
    country,
    timezone: String(formData.get("timezone") ?? "UTC"),
    status: String(formData.get("status") ?? "exploring"),
    summary: String(formData.get("summary") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
  };

  const slug =
    String(formData.get("slug") ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // What it was before, so opening can be told apart from a Village that
  // was already open and is being renamed.
  const { data: before } = id
    ? await supabase.from("villages").select("status").eq("id", id).maybeSingle()
    : { data: null };

  const { error } = id
    ? await supabase.from("villages").update(row).eq("id", id)
    : await supabase.from("villages").insert({ ...row, slug });

  if (error) return { error: error.message };

  if (id && row.status === "open" && before?.status !== "open") {
    await tellThePeopleWaiting(id, name);
  }

  revalidatePath("/global/villages");
  redirect("/global/villages?done=1");
}

// Roles are the Global team's alone to hand out, including Local Admin.
export async function assignRole(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const profileId = String(formData.get("profile_id"));
  const role = String(formData.get("role"));
  const scopeId = String(formData.get("scope_id") ?? "") || null;
  const scope = role === "global_admin" ? "global" : scopeId ? "village" : "global";

  const { error } = await supabase.from("member_roles").insert({
    profile_id: profileId,
    role,
    scope,
    scope_id: scope === "global" ? null : scopeId,
    review_on: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  if (error) {
    return { error: "That role is already held, or the details do not match." };
  }

  await record(admin.userId, "role.given", "profile", profileId, {
    role,
    scope,
    scope_id: scope === "global" ? null : scopeId,
  });

  revalidatePath("/global/roles");
  return {};
}

export async function endRole(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const roleId = String(formData.get("role_id"));

  // Nothing stopped the last Global Admin ending their own Global Admin
  // row, and roles_global_write is the only write policy on member_roles,
  // so once there are none nobody can ever create one. /global redirects
  // away for everybody and the page that grants roles is inside it. The
  // only way back is the service key and a SQL editor.
  const { data: going } = await supabase
    .from("member_roles")
    .select("profile_id, role")
    .eq("id", roleId)
    .maybeSingle();

  if (going?.role === "global_admin") {
    const { count } = await supabase
      .from("member_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "global_admin")
      .is("ended_at", null);

    if ((count ?? 0) <= 1) {
      return {
        error:
          "That is the last Global Admin. Give somebody else the role first, " +
          "or nobody can open the Global workspace again.",
      };
    }
  }

  const { data: ended, error } = await supabase
    .from("member_roles")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", roleId)
    .select("profile_id, role")
    .maybeSingle();

  if (error) return { error: error.message };

  await record(admin.userId, "role.ended", "profile", ended?.profile_id ?? null, {
    role: ended?.role,
  });

  revalidatePath("/global/roles");
  return {};
}

export async function updateReport(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: String(formData.get("status") ?? "in_progress"),
      action_note: String(formData.get("note") ?? "").trim() || null,
      handled_by: admin.userId,
    })
    .eq("id", String(formData.get("report_id")));

  if (error) return { error: error.message };

  await record(
    admin.userId,
    "report.handled",
    "report",
    String(formData.get("report_id")),
    {
      status: String(formData.get("status") ?? "in_progress"),
      note: String(formData.get("note") ?? "").trim() || null,
    }
  );

  revalidatePath("/global/moderation");
  return {};
}

export async function updateCity(
  _prev: GlobalState,
  formData: FormData
): Promise<GlobalState> {
  await requireGlobal();
  const supabase = await createClient();

  const { error } = await supabase
    .from("city_suggestions")
    .update({
      status: String(formData.get("status") ?? "watching"),
      note: String(formData.get("note") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("city_id")));

  if (error) return { error: error.message };

  revalidatePath("/global/cities");
  return {};
}
// Three pages promise this and none of it ever happened.
//
// /network/notified is titled "We will let you know" and says "You will
// get a notification when the {name} Village opens." village_interest
// has carried a told_at column since 0034 and nothing has ever written
// to it, and the only other read of that table is the page deciding
// whether to show that very line.
//
// /villages/suggest says "Join the waitlist and you will hear the day it
// opens" and the form says "So we can tell you when the Village opens.
// Nothing else is sent." city_suggestions held the address and nothing
// ever read it.
//
// And /settings/transfer tells a member to suggest their new city and
// "we will count you in when it opens", which rests on the same thing.
//
// Members are told in the platform, which works today. People who only
// left an address get an email, which does not go out until Resend is
// wired, and then it will without anything changing here. told_at is
// what stops either being told twice.
async function tellThePeopleWaiting(villageId: string, villageName: string) {
  const service = createAdminClient();

  const { data: waiting } = await service
    .from("village_interest")
    .select("profile_id")
    .eq("village_id", villageId)
    .is("told_at", null);

  for (const person of waiting ?? []) {
    await notify(
      person.profile_id,
      "village",
      `The ${villageName} Village is open`,
      "You asked to hear when it opened. You can ask to transfer to it from your settings.",
      "/network"
    );
  }

  if ((waiting ?? []).length > 0) {
    await service
      .from("village_interest")
      .update({ told_at: new Date().toISOString() })
      .eq("village_id", villageId)
      .is("told_at", null);
  }

  // The people who left only an address, through /villages/suggest or an
  // invitation request for a city with no Village. Matched on the city
  // rather than on an id, because a suggestion is made before the
  // Village exists and so can never carry one.
  const { data: village } = await service
    .from("villages")
    .select("city")
    .eq("id", villageId)
    .maybeSingle();

  if (!village?.city) return;

  const { data: suggestions } = await service
    .from("city_suggestions")
    .select("id, email, name")
    .ilike("city", village.city)
    .not("email", "is", null);

  for (const suggestion of suggestions ?? []) {
    if (!suggestion.email) continue;
    await sendEmail(
      suggestion.email,
      `The ${villageName} Village is open`,
      `${villageName} is open`,
      [
        `You asked us to tell you when a Village opened in ${village.city}. It has.`,
        "Requests to join are read by a person, so the next step is asking for an invitation.",
      ],
      { label: "Request an invitation", href: url("/apply") }
    );
  }

  if ((suggestions ?? []).length > 0) {
    await service
      .from("city_suggestions")
      .update({ status: "exploring", note: `Told when ${villageName} opened.` })
      .in("id", (suggestions ?? []).map((x) => x.id));
  }
}
