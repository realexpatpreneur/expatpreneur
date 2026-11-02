import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

// A temporary measurement: where this function runs, and how long one
// trip to the database takes from here. Nothing private is returned.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const trips: number[] = [];
  for (let i = 0; i < 4; i++) {
    const t0 = Date.now();
    await supabase.from("villages").select("id").limit(1);
    trips.push(Date.now() - t0);
  }
  const auth: number[] = [];
  for (let i = 0; i < 2; i++) {
    const t0 = Date.now();
    await fetch(`${url}/auth/v1/health`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: "no-store" });
    auth.push(Date.now() - t0);
  }
  return NextResponse.json({
    functionRegion: process.env.VERCEL_REGION ?? "unknown",
    databaseHost: new URL(url).host,
    databaseTripsMs: trips,
    authTripsMs: auth,
  });
}
