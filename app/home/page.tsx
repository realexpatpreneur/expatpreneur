import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Home, ExpatPreneurs Global" };

export default async function MemberHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/home");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <SiteHeader signedIn />
        <main className="wrap">
          <section className="band">
            <h1>Your profile did not load</h1>
            <div className="notice bad">{error.message}</div>
            <p className="muted small">
              Signed in as {user.email}. If this persists, send the message
              above to the build team.
            </p>
          </section>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SiteHeader signedIn />
        <main className="wrap">
          <section className="band">
            <h1>Almost there</h1>
            <p className="lead">
              You are signed in as {user.email}, but there is no member profile
              on this account yet. Your Local Admin sets that up when an
              invitation is approved.
            </p>
          </section>
        </main>
      </>
    );
  }

  // A newly approved member finishes their profile before anything else.
  if (profile.status === "onboarding") redirect("/welcome");

  const [villageRes, circleRes] = await Promise.all([
    profile.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", profile.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile.circle_id
      ? supabase
          .from("circles")
          .select("name")
          .eq("id", profile.circle_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const villageName = villageRes.data?.name ?? null;
  const circleName = circleRes.data?.name ?? null;

  const [{ count: unreadMessages }, { count: unreadNotifications }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .is("read_at", null),
    ]);

  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", user.id)
    .is("ended_at", null);
  const runsAVillage = (roles ?? []).some((r) =>
    ["local_admin", "global_admin"].includes(r.role)
  );
  const leadsSomething = (roles ?? []).some((r) =>
    ["circle_host", "industry_lead", "pod_lead", "educator"].includes(r.role)
  );

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>{profile.full_name.split(" ")[0]}, welcome back.</h1>
          <p className="lead">
            {villageName ? `${villageName} Village` : "No Village yet"}
            {circleName ? `, ${circleName}` : ""}
          </p>
          <p>
            <span className="chip mint">
              {profile.plan === "paid" ? "Paid member" : "Member"}
            </span>{" "}
            <span className="chip">{profile.status}</span>{" "}
            {profile.plan === "paid" ? null : (
              <Link className="chip" href="/upgrade">
                See the paid plan
              </Link>
            )}
          </p>
          <p className="row">
            <Link className="btn primary" href="/my-village">
              Your Village
            </Link>
            <Link className="btn" href="/settings">
              Settings
            </Link>
          </p>
          {runsAVillage || leadsSomething ? (
            <p className="row">
              {runsAVillage ? (
                <Link className="btn" href="/admin/applications">
                  Local Admin workspace
                </Link>
              ) : null}
              {leadsSomething || runsAVillage ? (
                <Link className="btn" href="/lead">
                  What you run
                </Link>
              ) : null}
            </p>
          ) : null}
        </section>

        <section className="band">
          <div className="grid three">
            <Link className="panel" href="/village">
              <h3>Ask &amp; Offer</h3>
              <p className="muted small">
                What your Village needs this week, and what you can give.
              </p>
            </Link>
            <Link className="panel" href="/for-you">
              <h3>For you</h3>
              <p className="muted small">
                People worth meeting and openings worth answering, from what
                you wrote on your profile.
              </p>
            </Link>
            <Link className="panel" href="/directory">
              <h3>Directory</h3>
              <p className="muted small">
                Who is in your Village, what they do, and what they know.
              </p>
            </Link>
            <Link className="panel" href="/market-exploration">
              <h3>Market Exploration</h3>
              <p className="muted small">
                Looking into a new country? Say who you need to meet.
              </p>
            </Link>
            <Link className="panel" href="/messages">
              <h3>
                Messages{unreadMessages ? ` (${unreadMessages})` : ""}
              </h3>
              <p className="muted small">
                Your Village writes directly. Other Villages ask first.
              </p>
            </Link>
            <Link className="panel" href="/notifications">
              <h3>
                Notifications{unreadNotifications ? ` (${unreadNotifications})` : ""}
              </h3>
              <p className="muted small">
                Replies, requests and what is happening around you.
              </p>
            </Link>
            <Link className="panel" href="/businesses">
              <h3>Businesses</h3>
              <p className="muted small">
                What members do, and which markets they already sell into.
              </p>
            </Link>
            <Link className="panel" href="/jobs">
              <h3>Jobs and freelance</h3>
              <p className="muted small">
                Members hiring members, projects and partners.
              </p>
            </Link>
            <Link className="panel" href="/groups">
              <h3>Industry Groups</h3>
              <p className="muted small">
                Your trade, across every Village.
              </p>
            </Link>
            <Link className="panel" href="/pods">
              <h3>Pods</h3>
              <p className="muted small">
                A few members who meet on a rhythm and keep each other honest.
              </p>
            </Link>
            <Link className="panel" href="/library">
              <h3>Resources</h3>
              <p className="muted small">
                Guides, templates and recordings your Village put together.
              </p>
            </Link>
            <Link className="panel" href="/markets">
              <h3>Market pathways</h3>
              <p className="muted small">
                The route into one country, step by step.
              </p>
            </Link>
            <Link className="panel" href="/learning">
              <h3>Learning</h3>
              <p className="muted small">
                Short courses from members who have already done it.
              </p>
            </Link>
            <Link className="panel" href="/photos">
              <h3>Photographs</h3>
              <p className="muted small">
                What the rooms looked like, from the people who were there.
              </p>
            </Link>
            <Link className="panel" href="/watch">
              <h3>Watch and Listen</h3>
              <p className="muted small">
                Members on what building away from home actually takes.
              </p>
            </Link>
            <Link className="panel" href="/suggestions">
              <h3>Suggestion box</h3>
              <p className="muted small">
                How could this be better? Send it with your name, or without.
              </p>
            </Link>
            <Link className="panel" href="/live">
              <h3>Live rooms</h3>
              <p className="muted small">
                Roundtables and Circle calls, in the platform itself.
              </p>
            </Link>
            <Link className="panel" href="/events">
              <h3>Events</h3>
              <p className="muted small">
                Gatherings in your Village, in other Villages and online.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}