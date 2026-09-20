"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = { error?: string; done?: string };

// A member registering for themselves. The database checks the audience,
// the tier and the Village rules again, so a refusal here is final.
export async function registerForEvent(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const eventId = String(formData.get("event_id"));
  const requiresApproval = formData.get("requires_approval") === "1";
  const isVisitor = formData.get("is_visitor") === "1";

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
    is_visitor: isVisitor,
    status: requiresApproval ? "pending" : "confirmed",
    note: String(formData.get("note") ?? "").trim() || null,
    dietary: String(formData.get("dietary") ?? "").trim() || null,
  });

  if (error) {
    return {
      error:
        "That registration was refused. Either the event is not open to you, or you are already on the list.",
    };
  }

  revalidatePath(`/events/${slug}`);
  return { done: requiresApproval ? "pending" : "confirmed" };
}

export async function cancelRegistration(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", String(formData.get("event_id")))
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/events/${slug}`);
  return { done: "cancelled" };
}

// Anyone, on or off the platform, for a public event.
export async function registerAsGuest(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const name = String(formData.get("guest_name") ?? "").trim();
  const email = String(formData.get("guest_email") ?? "").trim();
  if (!name || !email) return { error: "Your name and email are needed." };

  const { error } = await supabase.from("event_registrations").insert({
    event_id: String(formData.get("event_id")),
    guest_name: name,
    guest_email: email,
    status: formData.get("requires_approval") === "1" ? "pending" : "confirmed",
  });

  if (error) {
    return {
      error:
        "That did not go through. You may already be registered with that address.",
    };
  }

  redirect(`/e/${String(formData.get("slug"))}?registered=1`);
}