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
import { PublicPage } from "@/components/public-page";
import { Arrow, Face, PHOTO } from "@/components/design/parts";

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

  // A Village that is paused or archived has no public page, the same three
  // statuses the lists use.
  if (!village) notFound();
  if (!["open", "launching", "exploring"].includes(village.status)) notFound();

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
      .select(
        "profile_id, profiles!inner(id, full_name, headline, public_profile, avatar_url)"
      )
      .eq("role", "local_admin")
      .eq("scope_id", village.id)
      .is("ended_at", null),
  ]);

  const hosts = ((admins ?? []) as unknown as {
    profiles: {
      id: string;
      full_name: string;
      headline: string | null;
      public_profile: boolean;
      avatar_url: string | null;
    };
  }[])
    .map((row) => row.profiles)
    .filter((p) => p && p.public_profile);

  const waitlist = `/villages/suggest?city=${encodeURIComponent(
    village.city ?? ""
  )}&country=${encodeURIComponent(village.country ?? "")}`;
  const opening = village.status !== "open";

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!user) {
    return (
      <PublicPage active="/villages">
        <div className="d-page">
          {/* The photographic hero the prototype leads with. A Village with
              no photograph of its own falls back to the hatched block, so
              the ink scrim carries the words either way. */}
          <section
            style={{
              position: "relative",
              minHeight: 520,
              display: "flex",
              alignItems: "flex-end",
              overflow: "hidden",
            }}
          >
            <div
              className={`vphoto ${villagePhoto(village.slug)}`}
              role="img"
              aria-label={village.name}
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                padding: 0,
                borderRadius: 0,
                ...(village.cover_url
                  ? {
                      background: `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`,
                    }
                  : {}),
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top,rgba(15,20,25,.84) 0%,rgba(15,20,25,.34) 58%,rgba(15,20,25,.12) 100%)",
              }}
            />
            <div className="d-wrap" style={{ position: "relative", width: "100%", paddingTop: 120, paddingBottom: 56 }}>
              <span className="d-label">
                {statusLine[village.status] ?? village.status}
              </span>
              <h1 className="d-h1" style={{ marginTop: 18, color: "#FFFFFF", maxWidth: "20ch" }}>
                {village.name} Village
              </h1>
            </div>
          </section>

          <section style={{ padding: "28px 0 0" }}>
            <div className="d-wrap" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link className="d-small" href="/villages" style={{ fontWeight: 600 }}>
                Villages
              </Link>
              <Ic name="chev" style={{ width: 14, height: 14, color: "#B9C3CD" }} />
              <span className="d-small">{village.name}</span>
            </div>
          </section>

          <section style={{ padding: "48px 0 104px" }}>
            <div className="d-wrap d-apply">
              <div>
                <h2 className="d-h2" style={{ maxWidth: "22ch" }}>
                  Build in {village.city} without starting from zero.
                </h2>
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch" }}>
                  {village.summary}
                </p>

                {/* The prototype's three numbers, in its own order. */}
                <div className="d-where" style={{ marginTop: 44 }}>
                  {opening ? (
                    <>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Status</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>Opening soon</b>
                      </div>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Members</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 38, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{counts?.members ?? 0}</b>
                      </div>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Nationalities</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 38, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{counts?.nationalities ?? 0}</b>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Members</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 44, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{counts?.members ?? 0}</b>
                      </div>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Circles</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 38, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{counts?.circles ?? 0}</b>
                      </div>
                      <div className="d-wcol">
                        <span className="d-small" style={{ fontSize: 13, fontWeight: 600 }}>Nationalities</span>
                        <b style={{ display: "block", marginTop: 6, fontSize: 38, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{counts?.nationalities ?? 0}</b>
                      </div>
                    </>
                  )}
                </div>

                <div className="d-head" style={{ marginTop: 64 }}>
                  <h3 className="d-h2" style={{ fontSize: 28 }}>Upcoming events</h3>
                  <Link className="d-ulink" href="/events">
                    All {village.name} events
                  </Link>
                </div>
                {(events ?? []).length === 0 ? (
                  <div className="d-rows">
                    <div className="d-row">
                      <p className="d-body">No events published yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="d-rows">
                    {(events ?? []).map((event) => {
                      const d = new Date(event.starts_at);
                      return (
                        <Link className="d-row d-erow" key={event.id} href={`/e/${event.slug}`}>
                          <span className="d-d">
                            <b>{d.getDate()}</b>
                            <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                          </span>
                          <span className="d-th">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={event.cover_url ?? PHOTO.table} alt="" />
                          </span>
                          <span>
                            <b style={{ display: "block", fontSize: 19 }}>{event.title}</b>
                            <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 14 }}>
                              {`${whenText(event)}${event.venue ? `, ${event.venue}` : ""}`}
                            </span>
                          </span>
                          <span className="d-act">
                            <span className="d-btn d-btn-sm d-btn-line">Register</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside>
                <div className="d-card-paper" style={{ padding: 28 }}>
                  <h3 className="d-eyebrow">Your Local Admins</h3>
                  {hosts.length === 0 ? (
                    <p className="d-body" style={{ marginTop: 14 }}>
                      {opening
                        ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                        : "The Local Admins here keep their profiles private."}
                    </p>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      {hosts.map((host) => (
                        <Link
                          key={host.id}
                          href={`/members/${host.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "14px 0",
                            borderTop: "1px solid #E3E6EA",
                          }}
                        >
                          <Face name={host.full_name} src={host.avatar_url ?? null} size={44} />
                          <span style={{ minWidth: 0 }}>
                            <b style={{ display: "block", fontSize: 15 }}>{host.full_name}</b>
                            <span className="d-small" style={{ fontSize: 13 }}>{host.headline}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
                    <Link className="d-btn d-btn-sm d-btn-line" href="/members">
                      Meet members
                    </Link>
                    <Link className="d-btn d-btn-sm d-btn-line" href="/contact">
                      Contact the Village
                    </Link>
                  </div>
                </div>

                <div className="d-dark" style={{ marginTop: 24, borderRadius: 6, padding: 28 }}>
                  <h3 className="d-eyebrow d-on-dark">
                    {opening ? `Joining ${village.name}` : `Joining ${village.name}`}
                  </h3>
                  <p className="d-body" style={{ marginTop: 14 }}>
                    {opening
                      ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                      : "ExpatPreneurs is by invitation. Every request is read personally, and once membership begins you are welcomed into a Circle."}
                  </p>
                  <Link
                    className="d-btn d-btn-mint d-btn-wide d-shine"
                    href={opening ? waitlist : "/apply"}
                    style={{
                      marginTop: 24,
                      height: "auto",
                      minHeight: 52,
                      padding: "14px 20px",
                      whiteSpace: "normal",
                      textAlign: "center",
                      lineHeight: 1.35,
                    }}
                  >
                    {opening
                      ? "Join the waitlist"
                      : `Request an invitation to ${village.name}`}
                    <Arrow />
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

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
            <h1 style={{ color: "#fff", fontSize: 32, marginTop: 12 }}>
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
              <div className="g3 stats3" style={{ marginTop: 24 }}>
                {opening ? (
                  <>
                    <div className="stat">
                      <span>Status</span>
                      <b style={{ fontSize: 18 }}>Opening soon</b>
                    </div>
                    <div className="stat">
                      <span>Members</span>
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
                  <p className="muted small" style={{ marginTop: 8 }}>
                    {opening
                      ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                      : "The Local Admins here keep their profiles private."}
                  </p>
                ) : (
                  hosts.map((host) => (
                    <Link className="li linkrow" key={host.id} href={`/members/${host.id}`}>
                      <Av name={host.full_name} src={host.avatar_url ?? null} />
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
                <p className="muted small" style={{ marginTop: 8 }}>
                  {opening
                    ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                    : "ExpatPreneurs is by invitation. Every request is read personally, and once membership begins you are welcomed into a Circle."}
                </p>
                <Link
                  className="btn btn-primary"
                  href={opening ? waitlist : "/apply"}
                  style={{ marginTop: 16, width: "100%" }}
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
