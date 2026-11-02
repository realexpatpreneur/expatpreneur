import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { createAdminClient } from "@/lib/supabase/admin";

// Recordings are large and storage is not free. Anything past its keeping
// time goes, unless somebody published it into Watch and Listen or made it
// a lesson, in which case it is content now and stays.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  // This read `if (secret && ...)`, so with CRON_SECRET unset the guard
  // passed and the route was open to anyone on the internet who knew the
  // path. It deletes recordings with the service role. The Flodesk webhook
  // already gets this right; these two did not.
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const keepDays = Number(process.env.RECORDING_KEEP_DAYS ?? 180);
  const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString();
  const bucket = process.env.S3_BUCKET ?? "recordings";

  const service = createAdminClient();

  const { data: old } = await service
    .from("session_recordings")
    .select("id, url, created_at, media_item_id, lesson_id")
    .eq("status", "ready")
    .lt("created_at", cutoff)
    .is("media_item_id", null)
    .is("lesson_id", null)
    .limit(50);

  let removed = 0;

  for (const recording of old ?? []) {
    if (!recording.url) continue;

    const { error } = await service.storage.from(bucket).remove([recording.url]);
    if (error) continue;

    await service
      .from("session_recordings")
      .update({ status: "failed", url: null })
      .eq("id", recording.id);

    removed += 1;
  }

  return NextResponse.json({ removed, keepDays });
}