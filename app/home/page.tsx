import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { FeedPost, Compose, WaRow, EventRow, type FeedItem } from "@/components/feed";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

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

export default async function MemberHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/home");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, headline, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <WorkspaceShell kind="member">
        <PageHead title="Your profile did not load" />
        <div className="flag hold">
          <Ic name="info" />
          <span>{error.message}</span>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
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
  if (profile.status === "onboarding") redirect("/welcome");

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
        .select("id, title, body, sent_at, author_id")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, slug, title, starts_at, venue, is_online, village_id")
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
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", authorIds)
    : { data: [] };
  const who = (id: string | null) =>
    authors?.find((a) => a.id === id) ?? { full_name: "A member", headline: null };

  const items: FeedItem[] = [];

  for (const a of announcements ?? []) {
    const person = who(a.author_id);
    items.push({
      who: person.full_name,
      role: person.headline,
      when: ago(a.sent_at as string),
      kind: "Village announcement",
      tone: "blue",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}…` : a.body,
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
      role: person.headline,
      when: ago(a.created_at),
      kind: a.kind === "offer" ? "Offer" : "Ask",
      tone: a.kind === "offer" ? "mint" : "sun",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}…` : a.body,
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
      text: `${e.title} is on ${when.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}${e.is_online ? ", online" : e.venue ? `, at ${e.venue}` : ""}.`,
      embedTitle: e.title,
      embedLine: when.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      href: `/events/${e.slug}`,
      actions: [["Register", `/events/${e.slug}`]],
    });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name.split(" ")[0];

  return (
    <WorkspaceShell kind="member">
      <PageHead
        title={`${greeting}, ${firstName}`}
        sub={
          villageName
            ? `What is happening in ${villageName} this week.`
            : "What is happening across the network this week."
        }
        actions={
          <Link className="btn btn-primary" href="/village/new">
            <Ic name="plus" />
            Post an Ask or Offer
          </Link>
        }
      />

      <div className="feedlayout">
        <div className="feedcol">
          <Compose name={profile.full_name} />
          {items.length ? (
            items.map((item, i) => <FeedPost key={i} item={item} />)
          ) : (
            <div className="panel panel-wash">
              <h3 style={{ fontSize: 14 }}>Nothing here yet</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                When members post an Ask or an Offer, and when your Village
                announces something, it appears here.
              </p>
            </div>
          )}
        </div>

        <aside className="feedside">
          <div className="panel">
            <div className="row" style={{ gap: 12 }}>
              <Av name={profile.full_name} className="av-lg" />
              <div className="grow">
                <b>{profile.full_name}</b>
                <p className="muted small">{profile.headline}</p>
                <div className="tags" style={{ marginTop: 6 }}>
                  <span className={`tiertag ${profile.plan === "paid" ? "" : "free"}`}>
                    {profile.plan === "paid" ? "Paid member" : "Member"}
                  </span>
                </div>
              </div>
            </div>
            <div className="path" style={{ marginTop: 12 }}>
              <Link className="pnode" href="/network">
                <Ic name="globe" />
                Global network
              </Link>
              <Ic name="chev" />
              <Link className="pnode" href="/my-village">
                <Ic name="pin" />
                {villageName ?? "Your Village"}
              </Link>
              {circleName ? (
                <>
                  <Ic name="chev" />
                  <Link className="pnode on" href="/my-circle">
                    <Ic name="rings" />
                    {circleName}
                  </Link>
                </>
              ) : null}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn btn-ghost btn-sm" href="/me">
                My profile
              </Link>
              <Link className="btn btn-ghost btn-sm" href="/me/edit">
                Edit
              </Link>
            </div>
          </div>

          {events && events.length ? (
            <div className="panel">
              <div className="sechead">
                <h3>Coming up</h3>
                <Link href="/events">All events</Link>
              </div>
              <div className="divide">
                {events.map((e) => {
                  const d = new Date(e.starts_at);
                  return (
                    <EventRow
                      key={e.id}
                      href={`/events/${e.slug}`}
                      day={String(d.getDate())}
                      month={d.toLocaleDateString("en-GB", { month: "short" })}
                      title={e.title}
                      line={`${d.toLocaleDateString("en-GB", {
                        weekday: "long",
                      })}, ${d.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}${e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""}`}
                      visiting={e.village_id !== profile.village_id}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {circleName ? (
            <div className="panel">
              <div className="sechead">
                <h3>Your WhatsApp groups</h3>
              </div>
              <div className="stack">
                <WaRow
                  title={circleName}
                  sub="Your home base"
                  background="#E7EEF7"
                  colour="#4074AE"
                  icon="rings"
                  href="/my-circle"
                />
                <WaRow
                  title={`${villageName ?? "Village"} announcements`}
                  sub="Village news, read only"
                  background="#E6F4F1"
                  colour="#24675A"
                  icon="bell"
                  href="/my-village/announcements"
                />
              </div>
            </div>
          ) : null}

          {profile.plan === "paid" ? null : (
            <Link className="panel panel-wash linkrow" href="/upgrade">
              <h3 style={{ fontSize: 14 }}>The paid plan</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Contact members in any Village, attend their events, and
                promote what you do.
              </p>
            </Link>
          )}
        </aside>
      </div>
    </WorkspaceShell>
  );
}