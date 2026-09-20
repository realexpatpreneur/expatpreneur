import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Called when someone closes the room, so attendance is real rather than
// a guess.
export async function POST(request: Request) {
  const { slug, seconds } = (await request.json()) as {
    slug?: string;
    seconds?: number;
  };
  if (!slug) return NextResponse.json({ error: "No room named" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true });

  const { data: session } = await supabase
    .from("live_sessions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!session) return NextResponse.json({ ok: true });

  const { data: seat } = await supabase
    .from("session_participants")
    .select("id, seconds")
    .eq("session_id", session.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (seat) {
    await supabase
      .from("session_participants")
      .update({
        state: "left",
        left_at: new Date().toISOString(),
        seconds: (seat.seconds ?? 0) + Math.max(0, Math.round(seconds ?? 0)),
      })
      .eq("id", seat.id);
  }

  return NextResponse.json({ ok: true });
}