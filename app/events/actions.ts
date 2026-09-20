"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, url } from "@/lib/email";
import { whenText } from "@/lib/events";

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

  const [{ data: event }, { data: profile }] = await Promise.all([
    supabase
      .from("events")
      .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (event && profile?.email) {
    await sendEmail(
      profile.email,
      requiresApproval ? `Request sent: ${event.title}` : `You are going: ${event.title}`,
      event.title,
      [
        requiresApproval
          ? "Your request is with the host, who will confirm shortly."
          : "Your place is confirmed.",
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : event.venue ?? "The venue is on the event page.",
        "A reminder comes the day before and an hour before it starts.",
      ],
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
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

  const slug = String(formData.get("slug"));
  const { data: event } = await supabase
    .from("events")
    .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
    .eq("id", String(formData.get("event_id")))
    .maybeSingle();

  if (event) {
    await sendEmail(
      email,
      `You are registered: ${event.title}`,
      event.title,
      [
        `Thank you for registering, ${name.split(" ")[0]}.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link follows nearer the time."}`
          : event.venue ?? "The venue follows nearer the time.",
        "This event is open to everyone. Most of what ExpatPreneurs does is for members, by invitation.",
      ],
      { label: "See the event", href: url(`/e/${slug}`) }
    );
  }

  redirect(`/e/${slug}?registered=1`);
}