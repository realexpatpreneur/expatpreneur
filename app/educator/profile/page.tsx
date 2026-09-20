import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { EducatorProfileForm } from "./forms";

export const metadata = { title: "Educator profile, ExpatPreneurs Global" };

export default async function EducatorProfilePage() {
  const member = await requireMember("/educator/profile");
  const supabase = await createClient();

  const [{ data: profile }, { data: courses }] = await Promise.all([
    supabase
      .from("educator_profiles")
      .select("headline, about, teaches_in, markets")
      .eq("profile_id", member.id)
      .maybeSingle(),
    supabase
      .from("courses")
      .select("slug, title, status, review")
      .eq("educator_id", member.id)
      .eq("status", "published")
      .limit(1),
  ]);

  const live = (courses ?? [])[0];

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/educator">Your courses</Link>
          </p>
          <h1>Educator profile</h1>
          <p className="lead">
            What a learner reads about you on a course page.
          </p>
          {live ? (
            <p>
              <Link className="btn" href={`/learning/${live.slug}`}>
                View a course page
              </Link>
            </p>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <EducatorProfileForm profile={profile} name={member.full_name} />

            <div className="panel wash">
              <h3>Why this is separate</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Your member profile is about who you are in the network. This
                one is about why somebody should spend an evening learning
                from you, which is a different question and usually a shorter
                answer.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}