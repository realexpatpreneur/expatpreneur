import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { whenText } from "@/lib/events";
import { sessionWhen } from "@/lib/live";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Your Village, ExpatPreneurs Global" };

export default async function MyVillagePage() {
  const member = await requireMember("/my-village");
  const supabase = await createClient();

  if (!member.village_id) {
    return (
      <>
        <SiteHeader signedIn />
        <main className="wrap">
          <section className="band">
            <h1>No Village yet</h1>
            <p className="lead">
              Your Local Admin places you in one when your invitation is
              approved.
            </p>
            <Link className="btn" href="/home">
              Back to home
            </Link>
          </section>
        </main>
      </>
    );
  }

  const [
    { data: village },
    { data: announcements },
    { data: circles },
    { data: events },
    { data: sessions },
    { data: posts },
    { data: newMembers },
    { data: roles },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, name, city, country, status, summary, welcome_message, whatsapp_url, meeting_note")
      .eq("id", member.village_id)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("village_id", member.village_id)
      .not("sent_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("circle_capacity")
      .select("circle_id, name, members, places_left")
      .eq("village_id", member.village_id),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online")
      .eq("status", "published")
      .eq("village_id", member.village_id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(4),
    supabase
      .from("live_sessions")
      .select("id, slug, title, scheduled_start, scheduled_end, timezone, status")
      .in("status", ["scheduled", "live"])
      .eq("village_id", member.village_id)
      .order("scheduled_start")
      .limit(4),
    supabase
      .from("asks")
      .select("id, kind, title, status, created_at, author_id")
      .eq("village_id", member.village_id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, joined_on")
      .eq("village_id", member.village_id)
      .eq("status", "active")
      .order("joined_on", { ascending: false })
      .limit(6),
    supabase
      .from("member_roles")
      .select("profile_id, role")
      .eq("scope_id", member.village_id)
      .is("ended_at", null),
  ]);

  const leadIds = (roles ?? []).map((r) => r.profile_id);
  const { data: leads } = leadIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", leadIds)
    : { data: [] };

  const myCircle = (circles ?? []).find((c) => c.circle_id === member.circle_id);

  const { data: circleRow } = member.circle_id
    ? await supabase
        .from("circles")
        .select("whatsapp_url, host_id")
        .eq("id", member.circle_id)
        .maybeSingle()
    : { data: null };

  const roleLabel: Record<string, string> = {
    local_admin: "Local Admin",
    circle_host: "Circle Host",
    industry_lead: "Industry Lead",
    pod_lead: "Pod Lead",
    educator: "Educator",
  };

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p>
            <span className={`chip ${village?.status === "open" ? "mint" : ""}`}>
              {village?.status}
            </span>
          </p>
          <h1>{village?.name} Village</h1>
          <p className="lead">
            {village?.city}, {village?.country}. {village?.summary}
          </p>
        </section>

        {village?.welcome_message ? (
          <section className="band">
            <div className="panel wash">
              <h3>From the people who run this Village</h3>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                {village.welcome_message}
              </p>
              {village.meeting_note ? (
                <p className="muted small">{village.meeting_note}</p>
              ) : null}
              {village.whatsapp_url ? (
                <p style={{ marginTop: 10 }}>
                  <a className="btn" href={village.whatsapp_url} target="_blank" rel="noreferrer">
                    The Village WhatsApp group
                  </a>
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {(announcements ?? []).length ? (
          <section className="band">
            <h2>From your Local Admin</h2>
            <div className="stack">
              {(announcements ?? []).map((note) => (
                <div className="panel" key={note.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h3>{note.title}</h3>
                    <span className="chip">{timeAgo(note.created_at)}</span>
                  </div>
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{note.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>What is on</h3>
                {(events ?? []).length === 0 && (sessions ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing in the calendar yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(sessions ?? []).map((session) => (
                      <Link
                        className="rowlink"
                        key={session.id}
                        href={`/live/${session.slug}`}
                      >
                        <div>
                          <b>{session.title}</b>
                          <div className="muted small">
                            Online. {sessionWhen(session)}.
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${session.status === "live" ? "mint" : ""}`}
                          >
                            {session.status === "live" ? "Happening now" : "Live room"}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {(events ?? []).map((event) => (
                      <Link
                        className="rowlink"
                        key={event.id}
                        href={`/events/${event.slug}`}
                      >
                        <div>
                          <b>{event.title}</b>
                          <div className="muted small">
                            {whenText(event)}.{" "}
                            {event.is_online ? "Online" : event.venue ?? ""}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Asked this week</h3>
                {(posts ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing open. If you need something, say so.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(posts ?? []).map((post) => (
                      <Link className="rowlink" key={post.id} href={`/village/${post.id}`}>
                        <div>
                          <b>{post.title}</b>
                          <div className="muted small">
                            {post.kind === "offer" ? "Offer" : "Ask"}.{" "}
                            {timeAgo(post.created_at)}.
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <p style={{ marginTop: 12 }}>
                  <Link className="btn" href="/village/new">
                    Post something
                  </Link>
                </p>
              </div>

              <div className="panel">
                <h3>New faces</h3>
                {(newMembers ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody new yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(newMembers ?? []).map((person) => (
                      <Link
                        className="rowlink"
                        key={person.id}
                        href={`/members/${person.id}`}
                      >
                        <div className="facerow" style={{ margin: 0 }}>
                          {person.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img className="face" src={person.avatar_url} alt="" />
                          ) : null}
                          <div>
                            <b>{person.full_name}</b>
                            <div className="muted small">{person.headline}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <h3>{myCircle?.name ?? "Your Circle"}</h3>
                {myCircle ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {myCircle.members} members, {myCircle.places_left} places
                      left.
                    </p>
                    {circleRow?.whatsapp_url ? (
                      <a
                        className="btn mint"
                        href={circleRow.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open the WhatsApp group
                      </a>
                    ) : (
                      <p className="muted small">
                        The WhatsApp group link is not up yet. Your Local Admin
                        adds it.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    You are not in a Circle yet. Your Local Admin places
                    everyone by hand, which takes a few days.
                  </p>
                )}
              </div>

              <div className="panel">
                <h3>Circles here</h3>
                <div className="rows" style={{ marginTop: 12 }}>
                  {(circles ?? []).map((circle) => (
                    <div className="rowlink" key={circle.circle_id}>
                      <div>
                        <b>{circle.name}</b>
                        <div className="muted small">
                          {circle.members} members
                          {circle.places_left > 0
                            ? `, ${circle.places_left} places left`
                            : ", full"}
                        </div>
                      </div>
                      <div className="rowmeta">
                        {circle.circle_id === member.circle_id ? (
                          <span className="chip mint">Yours</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(leads ?? []).length ? (
                <div className="panel">
                  <h3>Who runs things</h3>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(leads ?? []).map((person) => (
                      <Link
                        className="rowlink"
                        key={person.id}
                        href={`/members/${person.id}`}
                      >
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">
                            {(roles ?? [])
                              .filter((r) => r.profile_id === person.id)
                              .map((r) => roleLabel[r.role] ?? r.role)
                              .join(", ")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="panel wash">
                <h3>Everything else</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  The Directory, the resources your Village gathered, and the
                  suggestion box.
                </p>
                <div className="row">
                  <Link className="btn" href="/directory">
                    Directory
                  </Link>
                  <Link className="btn" href="/library">
                    Resources
                  </Link>
                  <Link className="btn" href="/photos">
                    Photographs
                  </Link>
                  <Link className="btn" href="/suggestions">
                    Suggestion box
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}