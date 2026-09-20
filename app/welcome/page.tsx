import { WorkspaceShell } from "@/components/workspace-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeForm } from "./form";

export const metadata = { title: "Welcome, ExpatPreneurs Global" };

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, headline, business_name, industry, bio, can_help_with, looking_for, languages, markets_known, lived_in, public_profile, village_id, status"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <WorkspaceShell kind="member" nav="/welcome">
          <section className="sec">
            <h1>Almost there</h1>
            <p className="lead">
              You are signed in as {user.email}, but there is no member profile
              on this account yet.
            </p>
          </section>
        </WorkspaceShell>
    );
  }

  const { data: village } = profile.village_id
    ? await supabase
        .from("villages")
        .select("name, city")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  return (
    <WorkspaceShell kind="member" nav="/welcome">
        <section className="sec">
          <h1>Welcome to ExpatPreneurs.</h1>
          <p className="lead">
            {village?.name
              ? `You are in the ${village.name} Village. Finish your profile and your Circle can find you.`
              : "Finish your profile and your Local Admin will place you in a Circle."}
          </p>
        </section>
        <section className="sec">
          <WelcomeForm profile={profile} />
        </section>
      </WorkspaceShell>
  );
}