"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { record } from "@/lib/audit";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export type SettingsState = { error?: string; done?: string };

// Account: email, phone, password, time zone and language, as the
// prototype's Account tab lists them.
export async function saveAccount(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Email and password belong to the sign in system, not to the profile.
  if (email && email !== user.email) {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { error: "That email address could not be changed." };
  }

  if (password) {
    if (password.length < 8) {
      return { error: "A password needs at least eight characters." };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: "That password could not be set." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      email: email || undefined,
      phone: String(formData.get("phone") ?? "").trim() || null,
      time_zone: String(formData.get("time_zone") ?? "Gulf Standard Time (Dubai)"),
      language: String(formData.get("language") ?? "English"),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

export async function saveProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Your name is needed." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      avatar_url: String(formData.get("avatar_url") ?? "").trim() || null,
      headline: String(formData.get("headline") ?? "").trim() || null,
      business_name: String(formData.get("business_name") ?? "").trim() || null,
      industry: String(formData.get("industry") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      can_help_with: String(formData.get("can_help_with") ?? "").trim() || null,
      looking_for: String(formData.get("looking_for") ?? "").trim() || null,
      languages: list(formData.get("languages")),
      markets_known: list(formData.get("markets_known")),
      lived_in: list(formData.get("lived_in")),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

// Notifications: the six switches the prototype lists, no more and no
// fewer.
export async function saveNotificationPrefs(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { error } = await supabase.from("notification_prefs").upsert(
    {
      profile_id: user.id,
      replies: Boolean(formData.get("replies")),
      messages: Boolean(formData.get("messages")),
      events: Boolean(formData.get("events")),
      announcements: Boolean(formData.get("announcements")),
      digest: Boolean(formData.get("digest")),
      newsletter: Boolean(formData.get("newsletter")),
    },
    { onConflict: "profile_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

// Privacy: the three switches, then the data panel below them.
export async function savePrivacy(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { error } = await supabase
    .from("profiles")
    .update({
      public_profile: Boolean(formData.get("public_profile")),
      show_business: Boolean(formData.get("show_business")),
      findable_elsewhere: Boolean(formData.get("findable_elsewhere")),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

export async function askAboutMyData(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { error } = await supabase.from("data_requests").insert({
    profile_id: user.id,
    kind: String(formData.get("kind") ?? "export"),
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) return { error: "That did not send. Try again in a moment." };

  revalidatePath("/settings");
  return { done: "asked" };
}

export async function unblockMember(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", String(formData.get("blocked_id")));

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function leaveCommunity(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  if (String(formData.get("confirm") ?? "") !== "LEAVE") {
    return { error: "Type LEAVE to confirm." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("village_id, circle_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "left", public_profile: false })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await record(user.id, "member.left", "profile", user.id, {
    village_id: profile?.village_id ?? null,
  });

  if (profile?.circle_id) {
    const { data: circle } = await supabase
      .from("circles")
      .select("name")
      .eq("id", profile.circle_id)
      .maybeSingle();

    await supabase.from("whatsapp_tasks").insert({
      village_id: profile.village_id,
      profile_id: user.id,
      kind: "remove",
      group_name: circle?.name ?? "Village group",
    });
  }

  await supabase.auth.signOut();
  redirect("/?left=1");
}