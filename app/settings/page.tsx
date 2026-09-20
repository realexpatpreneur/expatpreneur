import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ProfileSettingsForm, LeaveForm, NotificationForm } from "./forms";
import { signOut } from "./actions";

export const metadata = { title: "Settings, ExpatPreneurs Global" };

export default async function SettingsPage() {
  const member = await requireMember("/settings");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, headline, business_name, industry, bio, can_help_with, looking_for, phone, languages, markets_known, lived_in, public_profile, avatar_url"
    )
    .eq("id", member.id)
    .maybeSingle();

  if (!profile) return null;

  const { data: prefs } = await supabase
    .from("notification_prefs")
    .select("messages, replies, connections, events, announcements, renewal")
    .eq("profile_id", member.id)
    .maybeSingle();

  const settings = prefs ?? {
    messages: true,
    replies: true,
    connections: true,
    events: true,
    announcements: true,
    renewal: true,
  };

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Settings</h1>
          <p className="lead">
            {profile.email}. {member.villageName ? `${member.villageName} Village.` : ""}
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <ProfileSettingsForm profile={profile} />

            <div className="stack">
              <NotificationForm prefs={settings} />

              <div className="panel">
                <h3>Your plan</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {isPaid(member)
                    ? "You are on the paid plan, so every Village is open to you."
                    : "Free membership. Your Village, your Circle and everything in it."}
                </p>
                <Link className="btn" href="/upgrade">
                  {isPaid(member) ? "Manage the plan" : "See the paid plan"}
                </Link>
              </div>

              <div className="panel">
                <h3>Sign out</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  On a shared computer, this is worth doing.
                </p>
                <form action={signOut}>
                  <button className="btn" type="submit">
                    Sign out
                  </button>
                </form>
              </div>

              <div className="panel wash">
                <h3>Leaving</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  No hard feelings and no exit interview. You can ask for an
                  invitation again later.
                </p>
                <LeaveForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}