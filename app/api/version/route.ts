import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// What is actually deployed. Vercel fills these in at build time, so a
// page can no longer disagree with the repository without it showing.
// No secrets: a commit hash and a date.
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "",
    environment: process.env.VERCEL_ENV ?? "local",
    builtAt: process.env.BUILD_TIME ?? "unknown",
    now: new Date().toISOString(),
  });
}