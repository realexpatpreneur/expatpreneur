import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser, roleCarriesMembership } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { MemberProfileView } from "@/components/design/member-profile";
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
      "id, full_name, headline, bio, business_name, industry, languages, markets_known, lived_in, can_help_with, looking_for, village_id, circle_id, public_profile, plan, avatar_url, complimentary"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!person) redirect("/home");

  // The same question Settings and Home ask, asked the same way.
  const onMembership =
    person.plan === "paid" ||
    Boolean(person.complimentary) ||
    (await roleCarriesMembership(user.id));

  const [{ data: village }, { data: circle }] = await Promise.all([
    person.village_id
      ? supabase
          .from("villages")
          .select("name, slug, country, cover_url")
          .eq("id", person.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    person.circle_id
      ? supabase.from("circles").select("name").eq("id", person.circle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: recent } = await supabase
    .from("asks")
    .select("id, kind, title, status, created_at")
    .eq("author_id", person.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <WorkspaceShell kind="member">
      <MemberProfileView
        person={person}
        villageName={village?.name ?? null}
        circleName={circle?.name ?? null}
        relation={publicView ? "As the public sees it" : null}
        self
        publicView={publicView}
        recent={recent ?? []}
        top={
          <div className="m-seg" role="tablist" aria-label="View as" style={{ marginBottom: 28 }}>
            <Link role="tab" aria-selected={!publicView} href="/me" className={`fchip ${publicView ? "" : "on"}`}>
              As members see it
            </Link>
            <Link role="tab" aria-selected={publicView} href="/me?view=public" className={`fchip ${publicView ? "on" : ""}`}>
              As the public sees it
            </Link>
          </div>
        }
        actions={
          <>
            <Link className="btn btn-primary" href="/me/edit" style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
              <Ic name="edit" />
              Edit profile
            </Link>
            <Link className="btn btn-ghost" href="/settings" style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
              <Ic name="eye" />
              Who can see it
            </Link>
          </>
        }
        notice={
          publicView ? (
            <div className="sp-notice">
              <Ic name={person.public_profile ? "eye" : "lock"} />
              <span>
                {person.public_profile ? (
                  <>
                    <b>This is the whole of what a visitor sees.</b> They
                    reach it from the Directory on the website, without
                    signing in.
                  </>
                ) : (
                  <>
                    <b>Nobody outside can reach this page.</b> Your profile is
                    off the public site, so a visitor opening this address is
                    told there is nothing here. This is what they would see if
                    you turned it on.
                  </>
                )}
              </span>
            </div>
          ) : null
        }
        aside={
          <>
            <div className="m-card">
              <h3>What the public can see</h3>
              <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
                {person.public_profile
                  ? "Your profile appears on the website. What you are looking for stays with members, and your email and phone are never shown."
                  : "Your profile is hidden from the public site. Members can still find you in the Directory."}
              </p>
              <Link className="m-ulink" href="/settings" style={{ display: "inline-block", marginTop: 12, fontSize: 14 }}>
                Change this
              </Link>
            </div>
            {onMembership ? null : (
              <Link className="m-card m-ink-card m-strip" href="/upgrade" style={{ display: "block", marginTop: 0 }}>
                <span className="m-kind" style={{ color: "#A8DCD1" }}>Village Membership</span>
                <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.55, color: "#DCE3E9" }}>
                  Reach members in every Village, and promote what you do.
                </p>
              </Link>
            )}
          </>
        }
      />
    </WorkspaceShell>
  );
}
