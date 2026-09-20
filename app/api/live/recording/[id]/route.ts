import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Recordings live in a private bucket, so there is no address that simply
// works. This asks the database whether this person may watch, then hands
// out a link that lasts an hour.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Reading the row is the permission check: the rule on the table only
  // returns it to a host or to someone the session was open to.
  const { data: recording } = await supabase
    .from("session_recordings")
    .select("id, url, status")
    .eq("id", id)
    .maybeSingle();

  if (!recording) {
    return NextResponse.json({ error: "Not for you" }, { status: 403 });
  }
  if (recording.status !== "ready" || !recording.url) {
    return NextResponse.json({ error: "Not ready yet" }, { status: 409 });
  }

  const service = createAdminClient();
  const { data: signed, error } = await service.storage
    .from(process.env.S3_BUCKET ?? "recordings")
    .createSignedUrl(recording.url, 60 * 60);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "That file could not be opened" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}