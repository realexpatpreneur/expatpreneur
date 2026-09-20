// Shared helpers for events: how a time reads, and who may register.

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  venue: string | null;
  is_online: boolean;
  visibility: string;
  audience: string;
  audience_id: string | null;
  tier: string;
  requires_approval: boolean;
  show_guest_list: boolean;
  capacity: number;
  visitor_places: number;
  price_cents: number;
  currency: string;
  status: string;
  village_id: string | null;
  host_id: string | null;
};

export function whenText(event: { starts_at: string; ends_at: string | null; timezone: string }) {
  const start = new Date(event.starts_at);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: event.timezone,
  });
  const from = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  });
  if (!event.ends_at) return `${date}, ${from}`;
  const to = new Date(event.ends_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  });
  return `${date}, ${from} to ${to}`;
}

export function priceText(event: { price_cents: number; currency: string }) {
  if (!event.price_cents) return "Free";
  return `${(event.price_cents / 100).toFixed(2)} ${event.currency}`;
}

// Who the event is open to, in a line a member can read.
export function audienceText(
  event: { visibility: string; audience: string; tier: string },
  audienceName: string | null
) {
  if (event.visibility === "public") return "Anyone, on or off the platform";
  const who =
    event.audience === "global"
      ? "Members in every Village"
      : audienceName ?? "Members";
  return event.tier === "paid" ? `${who}, paid members only` : who;
}

// The same rules the database enforces, so the page can explain itself
// instead of failing on submit.
export function registrationBlock(
  event: EventRow,
  member: { plan: string; village_id: string | null; circle_id: string | null } | null
): string | null {
  if (event.visibility === "public") return null;
  if (!member) return "This event is for members.";
  if (event.tier === "paid" && member.plan !== "paid") {
    return "This event is open to paid members.";
  }
  if (event.audience === "village" && event.audience_id !== member.village_id) {
    return member.plan === "paid"
      ? null
      : "Attending events in other Villages is part of the paid plan.";
  }
  if (event.audience === "circle" && event.audience_id !== member.circle_id) {
    return "This event is for one Circle.";
  }
  return null;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "event"}-${suffix}`;
}