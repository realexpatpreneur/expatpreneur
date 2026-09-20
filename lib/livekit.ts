import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

// The media provider. Everything the community cares about lives in the
// database; this file only mints tokens and opens rooms.
export const liveReady = Boolean(
  process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.LIVEKIT_URL
);

export const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? process.env.LIVEKIT_URL ?? "";

export function roomService() {
  return new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

type Grantee = {
  identity: string;
  name: string;
  room: string;
  role: string;
  canSpeak: boolean;
};

// What each role may do in the room. Hosts run it, presenters speak,
// participants speak in a roundtable and listen in a large session,
// observers only ever watch.
export async function mintToken({ identity, name, room, role, canSpeak }: Grantee) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name, ttl: "3h" }
  );

  const isHost = role === "host" || role === "cohost";

  token.addGrant({
    room,
    roomJoin: true,
    roomAdmin: isHost,            // mute others, remove people, end it
    canPublish: canSpeak,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

  token.metadata = JSON.stringify({ role });

  return await token.toJwt();
}

// A roundtable is everyone talking. A hundred people is a broadcast, so
// the floor is given out rather than assumed.
export function speaksByDefault(role: string, maxParticipants: number) {
  if (["host", "cohost", "presenter"].includes(role)) return true;
  if (role === "observer") return false;
  return maxParticipants <= 50;
}