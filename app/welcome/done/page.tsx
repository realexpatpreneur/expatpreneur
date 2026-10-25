import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";

export const metadata = { title: "You are in, ExpatPreneurs Global" };

export default async function WelcomeDonePage() {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) redirect("/login?next=/home");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, village_id, circle_id, status, plan")
    .eq("id", user.id)
    .maybeSingle();

  // Approved, signed in, profile written, and not yet paid for. Their
  // membership begins at the checkout, so that is all this page offers.
  const awaiting = profile?.status === "invited";

  const [{ data: village }, { data: circle }] = await Promise.all([
    profile?.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", profile.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile?.circle_id
      ? supabase
          .from("circle_rooms")
          .select("name, whatsapp_url")
          .eq("id", profile.circle_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (awaiting) {
    return (
      <WorkspaceShell kind="member" nav="/welcome/done">
        <section className="sec">
          <h1>One thing left.</h1>
          <p className="lead">
            {village?.name
              ? `Your profile is written and your place in ${village.name} is held. Membership starts when it is paid for.`
              : "Your profile is written and your place is held. Membership starts when it is paid for."}
          </p>
        </section>

        <section className="sec">
          <div className="panel" style={{ maxWidth: 560 }}>
            <h3>Your membership</h3>
            <p className="muted small" style={{ margin: "6px 0 12px" }}>
              Your Village sets its own price, in its own currency. The next
              page shows yours and takes you to the checkout. Your Circle and
              its WhatsApp group follow straight after.
            </p>
            <Link className="btn btn-primary" href="/upgrade">
              See what your Village costs
            </Link>
          </div>
        </section>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell kind="member" nav="/welcome/done">
        <section className="sec">
          <h1>You are in.</h1>
          <p className="lead">
            {village?.name
              ? `Your profile is live in the ${village.name} Village.`
              : "Your profile is live."}
          </p>
        </section>

        <section className="sec">
          <div className="g3">
            <div className="panel">
              <h3>{circle?.name ?? "Your Circle"}</h3>
              {circle?.name ? (
                <p className="muted small">
                  This is your home base: up to 50 members who meet, ask and
                  answer each other.
                </p>
              ) : (
                <p className="muted small">
                  Your Local Admin places you in a Circle shortly. You will hear
                  from them.
                </p>
              )}
              {circle?.whatsapp_url && !/X{4,}/.test(circle.whatsapp_url) ? (
                <p>
                  <a
                    className="btn mint"
                    href={circle.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open the WhatsApp group
                  </a>
                </p>
              ) : circle?.name ? (
                <p className="muted small">
                  Your Local Admin adds you to the WhatsApp group by hand, so it
                  may take a day.
                </p>
              ) : null}
            </div>

            <Link className="panel" href="/home">
              <h3>Your home</h3>
              <p className="muted small">
                Everything in one place: your Village, events and the people
                around you.
              </p>
            </Link>

            <Link className="panel" href="/events">
              <h3>Come to something</h3>
              <p className="muted small">
                The fastest way in is turning up once. Look at what is on.
              </p>
            </Link>
          </div>
        </section>
      </WorkspaceShell>
  );
}