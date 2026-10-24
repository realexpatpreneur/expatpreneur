import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { ProfileView, SideCard, ActivityCard, type Row } from "@/components/profile-view";
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
      "id, full_name, headline, bio, business_name, industry, languages, markets_known, lived_in, can_help_with, looking_for, village_id, circle_id, public_profile, plan, avatar_url, founding"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!person) redirect("/home");

  const [{ data: village }, { data: circle }, { count: askCount }, { count: eventCount }] =
    await Promise.all([
      person.village_id
        ? supabase
            .from("villages")
            .select("name, slug, city, country")
            .eq("id", person.village_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      person.circle_id
        ? supabase.from("circles").select("name").eq("id", person.circle_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("asks")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id),
      supabase
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);

  // The prototype also counts introductions made. Nothing records one,
  // so it is left out rather than filled with a number that means
  // nothing.
  const extraRows: Row[] = [
    [
      "Open to",
      publicView ? <span className="muted">Members only</span> : "Collaboration, referrals",
    ],
  ];
  if (!publicView) {
    extraRows.push(["Email and phone", <span className="muted" key="ep">Never shown</span>]);
  }

  return (
    <WorkspaceShell kind="member" nav="/me">
      <PageHead
        title="My profile"
        actions={
          <>
            <Link className="btn btn-primary" href="/me/edit">
              <Ic name="edit" />
              Edit profile
            </Link>
            <Link className="btn btn-ghost" href="/settings?show=privacy">
              <Ic name="eye" />
              Visibility
            </Link>
          </>
        }
      />

      <div className="tabs">
        <Link href="/me" aria-current={publicView ? undefined : "page"}>
          As members see it
        </Link>
        <Link href="/me?view=public" aria-current={publicView ? "page" : undefined}>
          As the public sees it
        </Link>
      </div>

      <div style={{ marginTop: 14 }}>
        <ProfileView
          person={person}
          villageName={village?.name ?? null}
          villageCity={village?.city ?? null}
          country={village?.country ?? null}
          circleName={publicView ? null : circle?.name ?? null}
          publicView={publicView}
          extraRows={extraRows}
          aside={
            <>
              {person.business_name ? (
                <SideCard
                  href="/businesses"
                  title={person.business_name}
                  line={person.industry}
                  cta="View business"
                />
              ) : null}
              <ActivityCard
                rows={[
                  ["Asks and offers", askCount ?? 0],
                  ["Events attended", eventCount ?? 0],
                ]}
              />
              {person.plan === "paid" ? null : (
                <SideCard
                  href="/upgrade"
                  title="The paid plan"
                  line="Reach members in every Village, and promote what you do."
                />
              )}
            </>
          }
        />
      </div>
    </WorkspaceShell>
  );
}