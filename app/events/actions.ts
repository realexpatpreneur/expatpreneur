"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
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

  const waiting = formData.get("waiting_list") === "1";

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
    is_visitor: isVisitor,
    status: waiting ? "waitlist" : requiresApproval ? "pending" : "confirmed",
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

  if (waiting) {
    revalidatePath(`/events/${slug}`);
    return { done: "waiting" };
  }

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

// A place that comes free goes to whoever has waited longest, and they are
// told rather than left to notice.
export async function offerThePlaceOn(eventId: string, slug: string) {
  const service = createAdminClient();

  const { data: event } = await service
    .from("events")
    .select("id, title, capacity, starts_at, ends_at, timezone, venue, address, is_online, online_url")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return;

  const { count: taken } = await service
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if ((taken ?? 0) >= event.capacity) return;

  const { data: next } = await service
    .from("event_registrations")
    .select("id, profile_id")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!next?.profile_id) return;

  await service
    .from("event_registrations")
    .update({ status: "confirmed" })
    .eq("id", next.id);

  await notify(
    next.profile_id,
    "event",
    `A place came free: ${event.title}`,
    "You were next on the list, and you are in.",
    `/events/${slug}`
  );

  const { data: person } = await service
    .from("profiles")
    .select("email, full_name")
    .eq("id", next.profile_id)
    .maybeSingle();

  if (person?.email) {
    await sendEmail(
      person.email,
      `A place came free: ${event.title}`,
      "You are in",
      [
        `${person.full_name.split(" ")[0]}, somebody gave up their place and you were next.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : `${event.venue ?? ""} ${event.address ?? ""}`.trim() ||
            "The venue is on the event page.",
        "If you can no longer make it, cancel so the next person gets it.",
      ],
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
  }
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

  const eventId = String(formData.get("event_id"));

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  await offerThePlaceOn(eventId, slug);

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