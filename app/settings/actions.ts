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
      phone: String(formData.get("phone") ?? "").trim() || null,
      languages: list(formData.get("languages")),
      markets_known: list(formData.get("markets_known")),
      lived_in: list(formData.get("lived_in")),
      public_profile: Boolean(formData.get("public_profile")),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Leaving is the member's own decision and takes effect at once. The Local
// Admin sees it and removes them from the WhatsApp groups.
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

// What reaches the inbox. Notifications inside the platform are unaffected.
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
      messages: Boolean(formData.get("messages")),
      replies: Boolean(formData.get("replies")),
      connections: Boolean(formData.get("connections")),
      events: Boolean(formData.get("events")),
      announcements: Boolean(formData.get("announcements")),
      renewal: Boolean(formData.get("renewal")),
    },
    { onConflict: "profile_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { done: "saved" };
}

// A member asking for their own data, or for it to be removed. European
// law applies the moment Lisbon and Paris open, and this is the route.
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