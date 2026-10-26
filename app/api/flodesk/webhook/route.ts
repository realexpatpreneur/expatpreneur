import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// When somebody unsubscribes in Flodesk, our own table hears about it, so
// the two lists never disagree about who wants the newsletter.
//
// Flodesk does not sign what it sends, so the only thing separating a real
// call from anybody else is a secret in the address itself. The webhook is
// registered over there with ?key= on the end, and that key appears nowhere
// a visitor can reach.

type Payload = {
  event_name?: string;
  subscriber?: { email?: string };
};

export async function POST(request: Request) {
  const secret = process.env.FLODESK_WEBHOOK_SECRET;
  const key = new URL(request.url).searchParams.get("key");
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    // Nothing we can read is nothing we can act on, and arguing with a
    // webhook only makes it try again.
    return NextResponse.json({ ok: true });
  }

  const email = body?.subscriber?.email;

  if (body?.event_name === "subscriber.unsubscribed" && typeof email === "string") {
    const service = createAdminClient();
    await service
      .from("newsletter_signups")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
  }

  // Flodesk wants any 2XX back, whatever we made of it.
  return NextResponse.json({ ok: true });
}
