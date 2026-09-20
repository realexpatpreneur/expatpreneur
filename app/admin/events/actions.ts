"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { slugify } from "@/lib/events";
import { offerThePlaceOn } from "@/app/events/actions";

export type EventFormState = { error?: string };

function audienceFrom(formData: FormData) {
  const visibility = String(formData.get("visibility") ?? "private");
  const choice = String(formData.get("audience") ?? "village");

  if (visibility === "public") {
    return { visibility, audience: "global", audience_id: null };
  }
  if (choice.startsWith("circle:")) {
    return { visibility, audience: "circle", audience_id: choice.slice(7) };
  }
  if (choice === "global") {
    return { visibility, audience: "global", audience_id: null };
  }
  return { visibility, audience: "village", audience_id: choice.slice(8) || null };
}

export async function saveEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!title || !date || !time) {
    return { error: "A title, a date and a time are needed." };
  }

  const { audience, audience_id, visibility } = audienceFrom(formData);
  const villageId =
    audience === "village" && audience_id
      ? audience_id
      : admin.homeVillageId ?? admin.villageIds[0] ?? null;

  const startsAt = new Date(`${date}T${time}:00`).toISOString();
  const endTime = String(formData.get("end_time") ?? "");
  const endsAt = endTime ? new Date(`${date}T${endTime}:00`).toISOString() : null;

  const venue = String(formData.get("venue") ?? "").trim();

  const row = {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: String(formData.get("timezone") ?? "Asia/Dubai"),
    venue: venue || null,
    address: String(formData.get("address") ?? "").trim() || null,
    release_hours: Number(formData.get("release_hours") ?? 48),
    is_online: venue.toLowerCase() === "online",
    visibility,
    audience,
    audience_id,
    village_id: villageId,
    tier: String(formData.get("tier") ?? "all"),
    requires_approval: Boolean(formData.get("requires_approval")),
    show_guest_list: Boolean(formData.get("show_guest_list")),
    capacity: Number(formData.get("capacity") ?? 30),
    visitor_places: Number(formData.get("visitor_places") ?? 0),
    price_cents: Math.round(Number(formData.get("price") ?? 0) * 100),
    currency: String(formData.get("currency") ?? "AED"),
    refund_policy: String(formData.get("refund_policy") ?? "48h"),
    reminders: {
      week: Boolean(formData.get("remind_week")),
      day: Boolean(formData.get("remind_day")),
      hour: Boolean(formData.get("remind_hour")),
      changes: Boolean(formData.get("remind_changes")),
      thanks: Boolean(formData.get("remind_thanks")),
    },
    status: String(formData.get("status") ?? "published"),
    host_id: admin.userId,
  };

  if (id) {
    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/events");
    redirect(`/admin/events/${id}?done=saved`);
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ ...row, slug: slugify(title) })
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  redirect(`/admin/events/${data?.id}?done=published`);
}

export async function decideRegistration(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: String(formData.get("decision") ?? "confirmed") })
    .eq("id", String(formData.get("registration_id")));

  if (error) return { error: error.message };

  // Declining somebody frees a place, and the next person waiting takes it.
  const eventId = String(formData.get("event_id"));
  if (String(formData.get("decision")) === "declined") {
    const { data: event } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .maybeSingle();
    if (event?.slug) await offerThePlaceOn(eventId, event.slug);
  }

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function checkInGuest(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const already = formData.get("checked_in") === "1";
  const { error } = await supabase
    .from("event_registrations")
    .update({ checked_in_at: already ? null : new Date().toISOString() })
    .eq("id", String(formData.get("registration_id")));

  if (error) return { error: error.message };

  revalidatePath(`/admin/events/${String(formData.get("event_id"))}`);
  return {};
}