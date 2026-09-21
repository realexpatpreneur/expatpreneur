import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ProfileView, SideCard } from "@/components/profile-view";
import { Ic } from "@/components/icon";

export const metadata = { title: "My profile, ExpatPreneurs Global" };

// Your own profile, in the two ways it can be read: as members see it,
// and as the public sees it.
export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "members" } = await searchParams;
  const publicView = view === "public";

  const supabase = await createClient();
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");

  const { data: person } = await supabase
    .from("profiles")
    .select(
      "id, full_name, headline, bio, business_name, industry, languages, markets_known, lived_in, can_help_with, looking_for, village_id, circle_id, public_profile, plan"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!person) redirect("/home");

  const [{ data: village }, { data: circle }] = await Promise.all([
    person.village_id
      ? supabase.from("villages").select("name, slug, country").eq("id", person.village_id).maybeSingle()
      : Promise.resolve({ data: null }),
    person.circle_id
      ? supabase.from("circles").select("name").eq("id", person.circle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <WorkspaceShell kind="member">
      <div className="sp-stage">
        <div className="sp-viewas">
          <Link href="/me" className={publicView ? "" : "on"}>
            As members see it
          </Link>
          <Link href="/me?view=public" className={publicView ? "on" : ""}>
            As the public sees it
          </Link>
        </div>

        <div className="sp-layout">
          <div>
            <ProfileView
              person={person}
              villageName={village?.name ?? null}
              villageSlug={village?.slug ?? null}
              country={village?.country ?? null}
              circleName={publicView ? null : circle?.name ?? null}
              publicView={publicView}
              actions={
                <>
                  <Link className="sp-cta sp-cta-glass" href="/me/edit">
                    <Ic name="edit" />
                    Edit profile
                  </Link>
                  <Link className="sp-icon" aria-label="Visibility" href="/settings">
                    <Ic name="eye" />
                  </Link>
                </>
              }
            />
          </div>

          <aside className="sp-aside">
            <div className="sp-side sp-progress">
              <b className="sp-side-title">What the public can see</b>
              <span>
                {person.public_profile
                  ? "Your profile appears on the website. What you are looking for stays with members, and your email and phone are never shown."
                  : "Your profile is hidden from the public site. Members can still find you in the Directory."}
              </span>
              <Link className="sp-mini" href="/settings">
                Change this
              </Link>
            </div>
            {person.business_name ? (
              <SideCard
                href="/businesses"
                icon="briefcase"
                title={person.business_name}
                line={person.industry}
              />
            ) : null}
            {person.plan === "paid" ? null : (
              <SideCard
                href="/upgrade"
                icon="star"
                title="The paid plan"
                line="Reach members in every Village, and promote what you do."
              />
            )}
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}