import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendEmailToMember, emailReady, url } from "@/lib/email";
import { whenText } from "@/lib/events";

// Runs on a schedule. It sends each reminder once, because every send is
// recorded and checked before the next run.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  if (!emailReady) {
    return NextResponse.json({ skipped: "No email key set" });
  }

  const service = createAdminClient();
  const now = Date.now();

  const { data: events } = await service
    .from("events")
    .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online, online_url, reminders")
    .eq("status", "published")
    .gte("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 8 * 86400000).toISOString());

  let sent = 0;

  for (const event of events ?? []) {
    const hoursAway = (new Date(event.starts_at).getTime() - now) / 3600000;
    const reminders = (event.reminders ?? {}) as Record<string, boolean>;

    // Which reminder, if any, is due right now.
    let kind: string | null = null;
    if (reminders.hour && hoursAway <= 1.5 && hoursAway > 0) kind = "hour";
    else if (reminders.day && hoursAway <= 26 && hoursAway > 22) kind = "day";
    else if (reminders.week && hoursAway <= 170 && hoursAway > 166) kind = "week";
    if (!kind) continue;

    const { data: registrations } = await service
      .from("event_registrations")
      .select("id, profile_id, guest_email, guest_name")
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    for (const registration of registrations ?? []) {
      const { data: already } = await service
        .from("event_reminders_sent")
        .select("id")
        .eq("registration_id", registration.id)
        .eq("kind", kind)
        .maybeSingle();

      if (already) continue;

      let to = registration.guest_email as string | null;
      let name = registration.guest_name as string | null;

      if (registration.profile_id) {
        const { data: profile } = await service
          .from("profiles")
          .select("email, full_name")
          .eq("id", registration.profile_id)
          .maybeSingle();
        to = profile?.email ?? null;
        name = profile?.full_name ?? null;
      }

      if (!to) continue;

      const where = event.is_online
        ? `Online. ${event.online_url ?? "The link is on the event page."}`
        : event.venue ?? "The venue is on the event page.";

      const send = registration.profile_id
        ? (subject: string, heading: string, lines: string[], action: { label: string; href: string }) =>
            sendEmailToMember(
              registration.profile_id as string,
              "events",
              to,
              subject,
              heading,
              lines,
              action
            )
        : (subject: string, heading: string, lines: string[], action: { label: string; href: string }) =>
            sendEmail(to as string, subject, heading, lines, action);

      await send(
        kind === "hour"
          ? `Starting soon: ${event.title}`
          : kind === "day"
            ? `Tomorrow: ${event.title}`
            : `Next week: ${event.title}`,
        event.title,
        [
          `${name ? `${name.split(" ")[0]}, a` : "A"} reminder about ${event.title}.`,
          whenText(event),
          where,
          kind === "hour"
            ? "If you can no longer make it, cancel your place so someone else can take it."
            : "See you there.",
        ],
        { label: "Open the event", href: url(`/events/${event.slug}`) }
      );

      await service.from("event_reminders_sent").insert({
        event_id: event.id,
        registration_id: registration.id,
        kind,
      });

      sent += 1;
    }
  }

  return NextResponse.json({ sent });
}