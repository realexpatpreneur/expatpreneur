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

  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", user.id)
    .is("ended_at", null);
  const runsAVillage = (roles ?? []).some((r) =>
    ["local_admin", "global_admin"].includes(r.role)
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
            <span className="chip">{profile.status}</span>
          </p>
          {runsAVillage ? (
            <p>
              <Link className="btn" href="/admin/applications">
                Local Admin workspace
              </Link>
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
            <Link className="panel" href="/market-exploration">
              <h3>Market Exploration</h3>
              <p className="muted small">
                Looking into a new country? Say who you need to meet.
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