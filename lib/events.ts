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
  address: string | null;
  release_hours: number;
  is_online: boolean;
  online_url: string | null;
  waitlist: boolean;
  visibility: string;
  audience: string;
  audience_id: string | null;
  tier: string;
  requires_approval: boolean;
  show_guest_list: boolean;
  capacity: number;
  visitor_places: number;
  price_cents: number;
  member_price_cents: number | null;
  currency: string;
  status: string;
  village_id: string | null;
  host_id: string | null;
};

// A timezone the formatter does not recognise throws, and one bad row
// should never take a page down. Anything unknown falls back to the
// reader's own zone.
function safeZone(zone: string | null | undefined) {
  if (!zone) return undefined;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}

export function whenText(event: { starts_at: string; ends_at: string | null; timezone: string }) {
  const zone = safeZone(event.timezone);
  const start = new Date(event.starts_at);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: zone,
  });
  const from = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone,
  });
  if (!event.ends_at) return `${date}, ${from}`;
  const to = new Date(event.ends_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone,
  });
  return `${date}, ${from} to ${to}`;
}

// What this person pays for a ticket. A Village Member pays the member
// price when the event carries one; null means the same as everybody
// else, which is how a course has worked since 0021.
export function ticketPrice(
  event: { price_cents: number; member_price_cents?: number | null },
  paid = false
) {
  if (paid && event.member_price_cents != null) return event.member_price_cents;
  return event.price_cents;
}

export function priceText(
  event: { price_cents: number; member_price_cents?: number | null; currency: string },
  paid = false
) {
  const cents = ticketPrice(event, paid);
  if (!cents) return "Free";
  return `${(cents / 100).toFixed(2)} ${event.currency}`;
}

// The saving a Village Member gets here, if there is one, in a line.
export function memberSaving(
  event: { price_cents: number; member_price_cents?: number | null; currency: string }
) {
  const m = event.member_price_cents;
  if (m == null || m >= event.price_cents) return null;
  if (!m) return "Free for Village Members";
  return `${(m / 100).toFixed(2)} ${event.currency} for Village Members`;
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
  return event.tier === "paid" ? `${who}, Village Members only` : who;
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
    return "This event is open to Village Members.";
  }
  if (event.audience === "village" && event.audience_id !== member.village_id) {
    return member.plan === "paid"
      ? null
      : "Attending events in other Villages is part of Village Membership.";
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