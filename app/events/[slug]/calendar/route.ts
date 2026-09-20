import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const stamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const escape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// The calendar file a member downloads after registering.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("title, description, starts_at, ends_at, venue, is_online, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return new NextResponse("Not found", { status: 404 });

  const end =
    event.ends_at ??
    new Date(new Date(event.starts_at).getTime() + 2 * 3600 * 1000).toISOString();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ExpatPreneurs Global//EN",
    "BEGIN:VEVENT",
    `UID:${event.slug}@expatpreneurs`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.starts_at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description ?? "")}`,
    `LOCATION:${escape(event.is_online ? "Online" : event.venue ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}