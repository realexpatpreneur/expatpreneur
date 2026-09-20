"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { slugify } from "@/lib/events";
import { offerThePlaceOn } from "@/app/events/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { sendEmailToMember, url } from "@/lib/email";
import { whenText } from "@/lib/events";

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

// Telling the people who are coming. Used when something moves and when an
// event is called off, which are the two moments a member cannot find out
// by themselves.
async function tellTheGuests(
  eventId: string,
  slug: string,
  title: string,
  heading: string,
  lines: string[]
) {
  const service = createAdminClient();

  const { data: guests } = await service
    .from("event_registrations")
    .select("profile_id")
    .eq("event_id", eventId)
    .in("status", ["confirmed", "pending", "waitlist"]);

  for (const guest of guests ?? []) {
    if (!guest.profile_id) continue;

    await notify(guest.profile_id, "event", heading, lines[0], `/events/${slug}`);

    const { data: person } = await service
      .from("profiles")
      .select("email")
      .eq("id", guest.profile_id)
      .maybeSingle();

    await sendEmailToMember(
      guest.profile_id,
      "events",
      person?.email ?? null,
      `${heading}: ${title}`,
      heading,
      lines,
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
  }
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
    // What it looked like before, so the guests can be told what moved.
    const { data: before } = await supabase
      .from("events")
      .select("slug, title, starts_at, ends_at, timezone, venue, address, status, reminders")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) return { error: error.message };

    if (before) {
      const calledOff =
        before.status !== "cancelled" && row.status === "cancelled";
      const moved =
        before.starts_at !== row.starts_at ||
        (before.venue ?? "") !== (row.venue ?? "") ||
        (before.address ?? "") !== (row.address ?? "");

      if (calledOff) {
        await tellTheGuests(id, before.slug, title, "This event is off", [
          "The host has called it off. Nothing is expected of you.",
          "If you paid for a ticket, the refund follows automatically.",
        ]);
      } else if (moved && (before.reminders as Record<string, boolean>)?.changes) {
        await tellTheGuests(id, before.slug, title, "Something has changed", [
          "The time or the place has moved.",
          whenText({ starts_at: row.starts_at, ends_at: row.ends_at, timezone: row.timezone }),
          row.venue ?? "See the event page.",
        ]);
      }
    }

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