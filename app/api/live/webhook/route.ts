import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

// LiveKit tells us when a recording finished, where the file went, and how
// long it runs. Nothing else is trusted to say a recording is ready.
export async function POST(request: Request) {
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) {
    return NextResponse.json({ error: "Live is off" }, { status: 503 });
  }

  const receiver = new WebhookReceiver(key, secret);
  const body = await request.text();
  const authorization = request.headers.get("authorization") ?? "";

  let event;
  try {
    event = await receiver.receive(body, authorization);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const service = createAdminClient();

  if (event.event === "egress_ended" || event.event === "egress_updated") {
    const info = event.egressInfo;
    if (!info) return NextResponse.json({ received: true });

    const file = info.fileResults?.[0];
    const seconds = file?.duration ? Number(file.duration) / 1_000_000_000 : null;

    const patch: Record<string, unknown> = {
      status:
        info.status === 3 || event.event === "egress_ended" ? "ready" : "recording",
    };

    if (file?.location) {
      patch.url = file.location;
      patch.size_bytes = file.size ? Number(file.size) : null;
      patch.duration = seconds
        ? `${Math.round(seconds / 60)} minutes`
        : null;
    }

    await service
      .from("session_recordings")
      .update(patch)
      .eq("provider_ref", info.egressId);
  }

  // When the room empties, the session is over.
  if (event.event === "room_finished" && event.room?.name) {
    await service
      .from("live_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("provider_room", event.room.name)
      .eq("status", "live");
  }

  return NextResponse.json({ received: true });
}