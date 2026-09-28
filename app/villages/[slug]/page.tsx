import { DualPage } from "@/components/dual-page";
import { villagePhoto } from "@/components/cards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { whenText } from "@/lib/events";

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
  const [{ count: memberCount }, { data: events }, { data: admins }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("village_id", village.id)
      .eq("status", "active"),
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

        <section className="sec">
          <h2 style={{ fontSize: 20 }}>
            Build in {village.city} without starting from zero.
          </h2>
          <p className="lead">{village.summary}</p>
          <p>
            {opening ? (
              <Link className="btn btn-primary" href={waitlist}>
                Join the waitlist
              </Link>
            ) : (
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>
            )}{" "}
            <Link className="btn btn-ghost" href="/villages">
              All Villages
            </Link>
          </p>
        </section>

        <section className="sec">
          <div className="g3">
            <div className="panel">
              <h3>Circles</h3>
              <p className="muted small">
                Up to fifty members each. Small enough that people actually know
                each other, and meet often enough to prove it.
              </p>
            </div>
            <div className="panel">
              <h3>Members</h3>
              <p className="muted small">
                {memberCount ?? 0} people building businesses here, from
                somewhere else.
              </p>
            </div>
            <div className="panel">
              <h3>How you get in</h3>
              <p className="muted small">
                By invitation. Every request is read by a person, and the Local
                Admin decides.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <h3>Who runs it</h3>
              {hosts.length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  {opening
                    ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                    : "The Local Admins here keep their profiles private."}
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {hosts.map((host) => (
                    <Link className="li linkrow" key={host.id} href={`/members/${host.id}`}>
                      <div>
                        <b>{host.full_name}</b>
                        <div className="muted small">{host.headline}</div>
                      </div>
                      <div className="rowmeta">
                        <span className="chip chip-mint">Local Admin</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="panel panel-wash">
              <h3>{opening ? "What happens before it opens" : "What a month looks like"}</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                {opening
                  ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                  : "One gathering for the whole Village, and smaller Circle meetings. Members ask and offer in between, and the WhatsApp groups carry the daily talk."}
              </p>
              <Link className="btn btn-ghost" href={opening ? waitlist : "/apply"}>
                {opening ? "Join the waitlist" : "Request an invitation"}
              </Link>
            </div>
          </div>
        </section>

        {(events ?? []).length ? (
          <section className="sec">
            <h2>Open to everyone</h2>
            <div className="divide">
              {(events ?? []).map((event) => (
                <Link className="li linkrow" key={event.id} href={`/e/${event.slug}`}>
                  <div>
                    <b>{event.title}</b>
                    <div className="muted small">
                      {whenText(event)}. {event.venue ?? "Online"}.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="sec">
            <h2>
              {village.status === "exploring"
                ? `Want a Village in ${village.city}?`
                : `Building something in ${village.city}?`}
            </h2>
            <p style={{ color: "#fff" }}>
              {village.status === "exploring"
                ? "It opens when enough people ask and someone local will run it."
                : "Membership is free. The paid plan adds every other Village."}
            </p>
            <Link
              className="btn btn-ghost"
              href={village.status === "exploring" ? "/villages/suggest" : "/apply"}
            >
              {village.status === "exploring"
                ? "Register interest"
                : "Request an invitation"}
            </Link>
          </div>
        </section>
      </DualPage>
  );
}