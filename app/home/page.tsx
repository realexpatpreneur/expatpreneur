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

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, status, plan, village_id, circle_id, villages(name), circles(name)"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <>
        <SiteHeader signedIn />
        <main className="wrap">
          <section className="band">
            <h1>Almost there</h1>
            <p className="lead">
              You are signed in, but your member profile has not been set up
              yet. Your Local Admin finishes that when your invitation is
              approved.
            </p>
          </section>
        </main>
      </>
    );
  }

  const village = Array.isArray(profile.villages)
    ? profile.villages[0]
    : profile.villages;
  const circle = Array.isArray(profile.circles)
    ? profile.circles[0]
    : profile.circles;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>{profile.full_name.split(" ")[0]}, welcome back.</h1>
          <p className="lead">
            {village?.name ? `${village.name} Village` : "No Village yet"}
            {circle?.name ? `, ${circle.name}` : ""}
          </p>
          <p>
            <span className="chip mint">
              {profile.plan === "paid" ? "Paid member" : "Member"}
            </span>{" "}
            <span className="chip">{profile.status}</span>
          </p>
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
