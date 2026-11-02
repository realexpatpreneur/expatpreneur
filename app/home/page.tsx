import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser, roleCarriesMembership } from "@/lib/member";
import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { FeedPost, Compose, type FeedItem } from "@/components/feed";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";
import { IntroduceForm } from "@/app/village/forms";

export const metadata = { title: "Home, ExpatPreneurs Global" };

// How long ago something happened, in the plain words the prototype uses.
function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// The moment a number of days back, for asking who joined since then.
function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export default async function MemberHomePage() {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) redirect("/login?next=/home");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, headline, status, plan, village_id, circle_id, avatar_url, looking_for, can_help_with, complimentary"
    )
    .eq("id", user.id)
    .maybeSingle();

  // The same question Settings asks, asked the same way, so the two
  // pages cannot disagree about whether somebody is a Village Member.
  const onMembership =
    profile?.plan === "paid" ||
    Boolean(profile?.complimentary) ||
    (await roleCarriesMembership(user.id));

  if (error) {
    return (
      <WorkspaceShell kind="member">
        <PageHead title="Your profile did not load" />
        <div className="flag hold">
          <Ic name="info" />
          <span>{error.message}</span>
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          Signed in as {user.email}. If this persists, send the message above
          to the build team.
        </p>
      </WorkspaceShell>
    );
  }

  if (!profile) {
    return (
      <WorkspaceShell kind="member">
        <PageHead
          title="Almost there"
          sub={`You are signed in as ${user.email}, but there is no member profile on this account yet. Your Local Admin sets that up when an invitation is approved.`}
        />
      </WorkspaceShell>
    );
  }

  // A newly approved member finishes their profile before anything else.
  // Invited is the same moment seen a step earlier: an invitation has
  // been accepted and nothing has been filled in. requireMember sends
  // both to /welcome, and this page reads the profile itself rather than
  // going through it, so it has to say so too. Without this an invited
  // person arrives on a member home with nothing on it.
  if (profile.status === "onboarding" || profile.status === "invited")
    redirect("/welcome");

  // And the same for somebody whose membership has ended. requireMember
  // does this for the other fifty six pages, and this one reads the
  // profile itself instead of going through it, so without this line the
  // member home was the one way past the gate.
  if (!onMembership) redirect("/upgrade");

  const [villageRes, circleRes] = await Promise.all([
    profile.village_id
      ? supabase.from("villages").select("name").eq("id", profile.village_id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.circle_id
      ? supabase.from("circles").select("name").eq("id", profile.circle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const villageName = villageRes.data?.name ?? null;
  const circleName = circleRes.data?.name ?? null;

  // The introduction waiting to be posted. It is written already, out of
  // the two answers they gave when they asked to join, and it stops
  // being offered the moment they post one.
  const { data: introduced } = await supabase
    .from("asks")
    .select("id")
    .eq("author_id", profile.id)
    .eq("kind", "introduction")
    .limit(1)
    .maybeSingle();

  const toIntroduce =
    !introduced &&
    Boolean(
      (profile.looking_for ?? "").trim() || (profile.can_help_with ?? "").trim()
    );

  // What has happened lately, and what is coming.
  const [{ data: asks }, { data: announcements }, { data: events }] =
    await Promise.all([
      supabase
        .from("asks")
        .select("id, kind, title, body, status, created_at, author_id, village_id")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("announcements")
        // No Village filter used to be here and none in the policy
        // either, so the three most recent announcements in the whole
        // network landed on every member's home page, and the line under
        // each one named the reader's own Village whichever Village had
        // actually sent it. 0078 scopes the policy; this says so here too.
        .select("id, title, body, sent_at, author_id, village_id")
        .eq("village_id", profile.village_id ?? "")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, slug, title, starts_at, venue, is_online, village_id, cover_url")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(4),
    ]);

  // The names behind the posts, in one query.
  const authorIds = [
    ...new Set(
      [...(asks ?? []).map((a) => a.author_id), ...(announcements ?? []).map((a) => a.author_id)]
        .filter(Boolean)
    ),
  ] as string[];
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, avatar_url")
        .in("id", authorIds)
    : { data: [] };
  const who = (id: string | null) =>
    authors?.find((a) => a.id === id) ?? {
      full_name: "A member",
      headline: null,
      avatar_url: null,
    };

  const items: FeedItem[] = [];

  for (const a of announcements ?? []) {
    const person = who(a.author_id);
    items.push({
      who: person.full_name,
      avatar: person.avatar_url,
      role: person.headline,
      when: ago(a.sent_at as string),
      kind: "Village announcement",
      tone: "blue",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}\u2026` : a.body,
      embedTitle: a.title,
      embedLine: villageName ? `${villageName} Village` : null,
      href: "/my-village/announcements",
      actions: [["Read the announcement", "/my-village/announcements"]],
    });
  }

  for (const a of asks ?? []) {
    const person = who(a.author_id);
    items.push({
      who: person.full_name,
      avatar: person.avatar_url,
      role: person.headline,
      when: ago(a.created_at),
      kind:
        a.kind === "introduction"
          ? "Introduction"
          : a.kind === "offer"
            ? "Offer"
            : "Ask",
      tone: a.kind === "ask" ? "sun" : "mint",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}\u2026` : a.body,
      embedTitle: a.title,
      embedLine: a.village_id === profile.village_id ? "Your Village" : "All Villages",
      href: `/village/${a.id}`,
      actions: [["Reply", `/village/${a.id}`], ["See all Asks", "/my-village"]],
    });
  }

  for (const e of events ?? []) {
    const when = new Date(e.starts_at);
    items.push({
      who: villageName ? `${villageName} Village` : "ExpatPreneurs",
      role: "Events",
      when: "Coming up",
      kind: "Event",
      tone: "navy",
      text: "",
      embedTitle: e.title,
      embedLine: `${when.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })}${e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""}`,
      href: `/events/${e.slug}`,
      image: e.cover_url,
      actions: [["Register", `/events/${e.slug}`]],
    });
  }

  // Who has joined the Village this week, so the feed opens on people.
  const weekAgo = daysAgo(7);
  const { data: newcomers, count: newCount } = profile.village_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url", { count: "exact" })
        .eq("village_id", profile.village_id)
        .eq("status", "active")
        .neq("id", profile.id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(4)
    : { data: null, count: 0 };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name.split(" ")[0];

  return (
    <WorkspaceShell kind="member">
      <div className="m-greet">
        <Av name={profile.full_name} src={profile.avatar_url ?? null} />
        <div>
          <h1>
            {greeting}, {firstName}
          </h1>
          <p>
            {villageName
              ? `What is happening in ${villageName} this week.`
              : "What is happening across the network this week."}
          </p>
        </div>
      </div>

      {toIntroduce ? (
        <section style={{ marginTop: 32 }}>
          <h2 className="m-h2">Say hello first</h2>
          <p className="m-muted" style={{ margin: "6px 0 14px", fontSize: 15 }}>
            {villageName
              ? `${villageName} cannot help somebody it has not met. This is already written from what you told us.`
              : "Your Village cannot help somebody it has not met. This is already written from what you told us."}
          </p>
          <IntroduceForm
            name={firstName}
            lookingFor={(profile.looking_for ?? "").trim()}
            canHelpWith={(profile.can_help_with ?? "").trim()}
          />
        </section>
      ) : null}

      <div className="m-feedgrid">
        <div style={{ minWidth: 0 }}>
          <Compose name={profile.full_name} avatar={profile.avatar_url} />

          {newcomers && newcomers.length ? (
            <Link className="m-strip" href="/my-village/members">
              <span className="m-faces">
                {newcomers.map((n) => (
                  <Av key={n.id} name={n.full_name} src={n.avatar_url ?? null} />
                ))}
              </span>
              <span>
                <b>
                  {newCount ?? newcomers.length} new{" "}
                  {(newCount ?? newcomers.length) === 1 ? "member" : "members"}
                </b>{" "}
                joined {villageName ? `${villageName} Village` : "your Village"} this week. Say hello.
              </span>
              <span className="m-arrow">Meet them</span>
            </Link>
          ) : null}

          <div style={{ marginTop: 8 }}>
            {items.length ? (
              items.map((item, i) => <FeedPost key={i} item={item} />)
            ) : (
              <div className="m-card" style={{ marginTop: 18, background: "#F4F6F8", borderColor: "#F4F6F8" }}>
                <h3>Nothing here yet</h3>
                <p className="m-muted" style={{ marginTop: 8, fontSize: 14 }}>
                  When members post an Ask or an Offer, and when your Village
                  announces something, it appears here.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside style={{ display: "grid", gap: 20 }}>
          <div className="m-card">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Av name={profile.full_name} className="av-lg" src={profile.avatar_url ?? null} />
              <div style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 16 }}>{profile.full_name}</b>
                {profile.headline ? (
                  <span className="m-muted" style={{ fontSize: 13 }}>{profile.headline}</span>
                ) : null}
                {onMembership ? (
                  <span className="m-kind m-offer" style={{ display: "block", marginTop: 6, fontSize: 11 }}>
                    Village Member
                  </span>
                ) : null}
              </div>
            </div>
            <div className="m-path" style={{ marginTop: 16 }}>
              <Link href="/network">Global</Link>
              <i>/</i>
              <Link href="/my-village" className={circleName ? "" : "on"}>
                {villageName ? `${villageName} Village` : "Your Village"}
              </Link>
              {circleName ? (
                <>
                  <i>/</i>
                  <Link className="on" href="/my-circle">
                    {circleName}
                  </Link>
                </>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Link className="btn btn-ghost btn-sm" href="/me">
                My profile
              </Link>
              <Link className="btn btn-ghost btn-sm" href="/me/edit">
                Edit
              </Link>
            </div>
          </div>

          {events && events.length ? (
            <div className="m-card">
              <div className="m-cardhead">
                <h3>Coming up</h3>
                <Link className="m-ulink" href="/events">
                  All events
                </Link>
              </div>
              <div style={{ marginTop: 10 }}>
                {events.map((e) => {
                  const d = new Date(e.starts_at);
                  return (
                    <Link key={e.id} className="m-row" href={`/events/${e.slug}`} style={{ gridTemplateColumns: "40px minmax(0,1fr)" }}>
                      <span className={`m-date ${e.village_id !== profile.village_id ? "visit" : ""}`}>
                        <b>{d.getDate()}</b>
                        <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                      </span>
                      <span>
                        <b style={{ display: "block" }}>{e.title}</b>
                        <span className="m-muted">
                          {d.toLocaleDateString("en-GB", { weekday: "long" })},{" "}
                          {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {circleName ? (
            <div className="m-card">
              <h3>Your WhatsApp groups</h3>
              <div style={{ marginTop: 10 }}>
                <Link className="m-row" href="/my-circle">
                  <span className="m-ic">
                    <Ic name="rings" />
                  </span>
                  <span>
                    <b style={{ display: "block" }}>{circleName}</b>
                    <span className="m-muted">Your home base</span>
                  </span>
                  <span className="btn btn-primary btn-sm">Open</span>
                </Link>
                <Link className="m-row" href="/my-village/announcements">
                  <span className="m-ic">
                    <Ic name="bell" />
                  </span>
                  <span>
                    <b style={{ display: "block" }}>{villageName ?? "Village"} announcements</b>
                    <span className="m-muted">Village news, read only</span>
                  </span>
                  <span className="btn btn-ghost btn-sm">Open</span>
                </Link>
              </div>
            </div>
          ) : null}

          {/* The upsell that used to sit here is gone. An unpaid member
              is redirected off this page before it renders now, so it
              could never be seen, and a panel nobody can reach is worse
              than no panel. /upgrade is where that case is handled. */}
        </aside>
      </div>
    </WorkspaceShell>
  );
}
