import { DualPage } from "@/components/dual-page";
import { villagePhoto } from "@/components/cards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { whenText } from "@/lib/events";
import { EventRow } from "@/components/feed";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

const statusLine: Record<string, string> = {
  open: "Open, by invitation",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused for now",
  archived: "Closed",
};

export default async function VillagePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const user = await currentUser();

  const { data: village } = await supabase
    .from("villages")
    .select("id, slug, name, city, country, status, summary, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!village) notFound();

  // Only what a stranger is allowed to see: members who chose to be public,
  // and events open to everyone.
  const [{ data: counts }, { data: events }, { data: admins }] = await Promise.all([
    // Counted by the database, because a visitor cannot read profiles.
    supabase
      .from("village_public_counts")
      .select("members, circles, nationalities")
      .eq("village_id", village.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url")
      .eq("village_id", village.id)
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(6),
    // Who runs this Village. Only the ones who chose to be listed
    // publicly are named.
    supabase
      .from("member_roles")
      .select("profile_id, profiles!inner(id, full_name, headline, public_profile)")
      .eq("role", "local_admin")
      .eq("scope_id", village.id)
      .is("ended_at", null),
  ]);

  const hosts = ((admins ?? []) as unknown as {
    profiles: { id: string; full_name: string; headline: string | null; public_profile: boolean };
  }[])
    .map((row) => row.profiles)
    .filter((p) => p && p.public_profile);

  const waitlist = `/villages/suggest?city=${encodeURIComponent(
    village.city ?? ""
  )}&country=${encodeURIComponent(village.country ?? "")}`;
  const opening = village.status !== "open";

  return (
    <DualPage member={Boolean(user)} nav="/network" active="/villages">
        {/* The photographic hero the prototype leads with. A Village with
            no photograph of its own falls back to the hatched block. */}
        <div
          className={`vphoto ${villagePhoto(village.slug)}`}
          role="img"
          aria-label={village.name}
          style={{
            height: 230,
            padding: 28,
            marginBottom: 24,
            ...(village.cover_url
              ? {
                  background: `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`,
                }
              : {}),
          }}
        >
          <div>
            <span className="chip" style={{ background: "rgba(255,255,255,.9)" }}>
              {statusLine[village.status] ?? village.status}
            </span>
            <h1 style={{ color: "#fff", fontSize: 32, marginTop: 10 }}>
              {village.name} Village
            </h1>
          </div>
        </div>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="crumbs">
            <Link href="/villages">Villages</Link>
            <Ic name="chev" />
            <span>{village.name}</span>
          </div>

          <div className="gside">
            <div>
              <h2 style={{ fontSize: 20 }}>
                Build in {village.city} without starting from zero.
              </h2>
              <p className="intro">{village.summary}</p>

              {/* The prototype's three numbers, in its own order. */}
              <div className="g3 stats3" style={{ marginTop: 22 }}>
                {opening ? (
                  <>
                    <div className="stat">
                      <span>Status</span>
                      <b style={{ fontSize: 18 }}>Opening soon</b>
                    </div>
                    <div className="stat">
                      <span>Founding members</span>
                      <b>{counts?.members ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Nationalities</span>
                      <b>{counts?.nationalities ?? 0}</b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat">
                      <span>Members</span>
                      <b>{counts?.members ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Circles</span>
                      <b>{counts?.circles ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Nationalities</span>
                      <b>{counts?.nationalities ?? 0}</b>
                    </div>
                  </>
                )}
              </div>

              <div className="sechead" style={{ marginTop: 28 }}>
                <h3>Upcoming events</h3>
                <Link className="small" style={{ fontWeight: 600 }} href="/events">
                  All {village.name} events
                </Link>
              </div>
              <div className="divide">
                {(events ?? []).length === 0 ? (
                  <p className="muted">No events published yet.</p>
                ) : (
                  (events ?? []).map((event) => {
                    const d = new Date(event.starts_at);
                    return (
                      <EventRow
                        key={event.id}
                        cover={event.cover_url}
                        href={`/e/${event.slug}`}
                        day={String(d.getDate())}
                        month={d.toLocaleDateString("en-GB", { month: "short" })}
                        title={event.title}
                        line={`${whenText(event)}${
                          event.venue ? `, ${event.venue}` : ""
                        }`}
                        right={
                          <Link
                            className="btn btn-ghost btn-sm evtact"
                            href={`/e/${event.slug}`}
                          >
                            Register
                          </Link>
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>

            <aside className="stack">
              <div className="panel">
                <h3 style={{ fontSize: 14 }}>Your Local Admins</h3>
                {hosts.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {opening
                      ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                      : "The Local Admins here keep their profiles private."}
                  </p>
                ) : (
                  hosts.map((host) => (
                    <Link className="li linkrow" key={host.id} href={`/members/${host.id}`}>
                      <Av name={host.full_name} />
                      <div className="grow">
                        <b>{host.full_name}</b>
                        <span className="muted small">{host.headline}</span>
                      </div>
                    </Link>
                  ))
                )}
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <Link className="btn btn-ghost btn-sm" href="/members">
                    Meet members
                  </Link>
                  <Link className="btn btn-ghost btn-sm" href="/contact">
                    Contact the Village
                  </Link>
                </div>
              </div>

              <div className="panel panel-wash">
                <h3 style={{ fontSize: 14 }}>
                  {opening ? `Joining ${village.name}` : `Joining ${village.name}`}
                </h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {opening
                    ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                    : "ExpatPreneurs is by invitation. Every request is read personally, and accepted members are welcomed into a Circle."}
                </p>
                <Link
                  className="btn btn-primary"
                  href={opening ? waitlist : "/apply"}
                  style={{ marginTop: 14, width: "100%" }}
                >
                  {opening
                    ? "Join the waitlist"
                    : `Request an invitation to ${village.name}`}
                </Link>
              </div>
            </aside>
          </div>
        </section>

      </DualPage>
  );
}