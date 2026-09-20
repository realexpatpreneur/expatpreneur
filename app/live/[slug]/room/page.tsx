import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { liveReady } from "@/lib/livekit";
import { roleLabel, type LiveSession } from "@/lib/live";
import { SiteHeader } from "@/components/site-header";
import { RoomClient } from "./room-client";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireMember(`/live/${slug}/room`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const session = data as LiveSession;

  const { data: role } = await supabase.rpc("session_role_for", { s: session });
  const myRole = (role as string) ?? "participant";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/live">Live rooms</Link>
          </p>
          <h1 style={{ fontSize: 26 }}>{session.title}</h1>
          <p className="muted small">
            You are here as {roleLabel[myRole]?.toLowerCase() ?? myRole}.
          </p>
        </section>

        <section className="band">
          {liveReady ? (
            <RoomClient slug={slug} onLeaveHref={`/live/${slug}`} />
          ) : (
            <div className="panel">
              <h3>Live video is not switched on yet</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Everything around the room works: who may come in, the lobby,
                the roles and the attendance. The audio and video need the
                LiveKit keys in the environment.
              </p>
              <Link className="btn" href={`/live/${slug}`}>
                Back to the session
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}