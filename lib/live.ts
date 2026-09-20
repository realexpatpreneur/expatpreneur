// Live sessions, the community side. Nothing here knows which media
// provider carries the audio and video.

export type LiveSession = {
  id: string;
  slug: string;
  title: string;
  purpose: string | null;
  event_id: string | null;
  village_id: string | null;
  visibility: string;
  audience: string;
  audience_id: string | null;
  tier: string;
  scheduled_start: string;
  scheduled_end: string | null;
  timezone: string;
  lobby: boolean;
  chat: boolean;
  hand_raise: boolean;
  allow_guests: boolean;
  max_participants: number;
  recording: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  provider: string | null;
  provider_room: string | null;
  created_by: string | null;
};

export const roleLabel: Record<string, string> = {
  host: "Host",
  cohost: "Co-host",
  presenter: "Presenter",
  participant: "In the room",
  observer: "Watching",
};

export const stateLabel: Record<string, string> = {
  invited: "Invited",
  waiting: "Waiting to be let in",
  admitted: "In the room",
  removed: "Removed",
  left: "Left",
};

// The same rules the database enforces, so a page can explain itself
// rather than failing when someone presses join.
export function joinBlock(
  session: LiveSession,
  member: { plan: string; village_id: string | null; circle_id: string | null } | null,
  isHost: boolean
): string | null {
  if (isHost) return null;
  if (session.visibility === "public" && session.allow_guests) return null;
  if (!member) return "This room is for members.";
  if (session.tier === "paid" && member.plan !== "paid") {
    return "This room is open to paid members.";
  }
  if (session.audience === "village" && session.audience_id !== member.village_id) {
    return member.plan === "paid"
      ? null
      : "Rooms in other Villages are part of the paid plan.";
  }
  if (session.audience === "circle" && session.audience_id !== member.circle_id) {
    return "This room is for one Circle.";
  }
  return null;
}

export function sessionWhen(session: {
  scheduled_start: string;
  scheduled_end: string | null;
  timezone: string;
}) {
  const start = new Date(session.scheduled_start);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: session.timezone,
  });
  const from = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: session.timezone,
  });
  if (!session.scheduled_end) return `${date}, ${from}`;
  const to = new Date(session.scheduled_end).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: session.timezone,
  });
  return `${date}, ${from} to ${to}`;
}

// Whether the doors are worth opening yet: fifteen minutes before, and
// while it is running.
export function doorsOpen(session: LiveSession) {
  if (session.status === "live") return true;
  if (session.status !== "scheduled") return false;
  const minutes =
    (new Date(session.scheduled_start).getTime() - Date.now()) / 60000;
  return minutes <= 15;
}