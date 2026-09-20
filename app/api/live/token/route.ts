import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { liveReady, mintToken, speaksByDefault, roomService } from "@/lib/livekit";

// The door. The database decides whether this person may come in and what
// they may do; this route only turns that answer into a token.
export async function POST(request: Request) {
  if (!liveReady) {
    return NextResponse.json(
      { error: "Live video is not switched on yet." },
      { status: 503 }
    );
  }

  const { slug } = (await request.json()) as { slug?: string };
  if (!slug) return NextResponse.json({ error: "No room named" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Signed out" }, { status: 401 });

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: "No such room" }, { status: 404 });

  const [{ data: allowed }, { data: role }, { data: profile }] = await Promise.all([
    supabase.rpc("can_join_session", { s: session }),
    supabase.rpc("session_role_for", { s: session }),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!allowed) {
    return NextResponse.json({ error: "This room is not open to you." }, { status: 403 });
  }

  const myRole = (role as string) ?? "participant";
  const isHost = ["host", "cohost"].includes(myRole);

  // The lobby is real: nobody gets a token until a host has let them in.
  const { data: seat } = await supabase
    .from("session_participants")
    .select("id, state, role")
    .eq("session_id", session.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!isHost) {
    if (!seat) {
      return NextResponse.json({ error: "Knock on the door first." }, { status: 403 });
    }
    if (seat.state === "removed") {
      return NextResponse.json({ error: "You were removed from this room." }, { status: 403 });
    }
    if (session.lobby && seat.state !== "admitted") {
      return NextResponse.json({ error: "A host has not let you in yet." }, { status: 403 });
    }
  }

  const mainRoom = session.provider_room ?? `session-${session.id}`;
  const effectiveRole = isHost ? myRole : seat?.role ?? "participant";

  // If the tables are open and this person has a place at one, that is
  // where they go. Hosts stay in the main room unless they pick a table.
  let roomName = mainRoom;
  let breakoutName: string | null = null;

  if (seat) {
    const { data: place } = await supabase
      .from("breakout_assignments")
      .select("room_id, breakout_rooms!inner(id, name, open, provider_room)")
      .eq("participant_id", seat.id)
      .maybeSingle();

    const table = place?.breakout_rooms as
      | { id: string; name: string; open: boolean; provider_room: string | null }
      | undefined;

    if (table?.open) {
      roomName = table.provider_room ?? `breakout-${table.id}`;
      breakoutName = table.name;

      if (!table.provider_room) {
        try {
          await roomService().createRoom({ name: roomName, emptyTimeout: 60 * 30 });
        } catch {
          // Already there.
        }
        await supabase
          .from("breakout_rooms")
          .update({ provider_room: roomName })
          .eq("id", table.id);
      }
    }
  }

  // Opening the main room is what a host does first, and it is recorded so
  // everyone else lands in the same place.
  if (!session.provider_room) {
    try {
      await roomService().createRoom({
        name: mainRoom,
        emptyTimeout: 60 * 30,
        maxParticipants: session.max_participants,
      });
    } catch {
      // Already there, which is fine.
    }
    await supabase
      .from("live_sessions")
      .update({ provider: "livekit", provider_room: mainRoom })
      .eq("id", session.id);
  }

  const token = await mintToken({
    identity: user.id,
    name: profile?.full_name ?? "A member",
    room: roomName,
    role: effectiveRole,
    canSpeak: speaksByDefault(effectiveRole, session.max_participants),
  });

  // Mark them as in the room, and note when they arrived.
  if (seat) {
    await supabase
      .from("session_participants")
      .update({
        state: "admitted",
        joined_at: seat.state === "admitted" ? undefined : new Date().toISOString(),
      })
      .eq("id", seat.id);
  } else if (isHost) {
    await supabase.from("session_participants").insert({
      session_id: session.id,
      profile_id: user.id,
      role: myRole,
      state: "admitted",
      joined_at: new Date().toISOString(),
    });
  }

  if (isHost && session.status === "scheduled") {
    await supabase
      .from("live_sessions")
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  return NextResponse.json({
    token,
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? process.env.LIVEKIT_URL,
    role: effectiveRole,
    canSpeak: speaksByDefault(effectiveRole, session.max_participants),
    recording: session.recording,
    title: session.title,
    breakout: breakoutName,
  });
}