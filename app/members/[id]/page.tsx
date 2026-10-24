import { DualPage } from "@/components/dual-page";
import { ProfileView, SideCard } from "@/components/profile-view";
import { Ic } from "@/components/icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { ConnectionRequestForm } from "@/app/messages/forms";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // A stranger can open this page too. The database decides whether the row
  // comes back at all; this decides how much of it is shown.
  const me = await whoIsHere();
  const supabase = await createClient();

  // A signed-in member may read the member-only fields. A stranger is not
  // granted them at all, so asking for them would fail the whole query.
  const columns = me
    ? "id, full_name, headline, bio, business_name, industry, languages, markets_known, lived_in, can_help_with, looking_for, village_id, circle_id, avatar_url, public_profile"
    : "id, full_name, headline, bio, business_name, industry, lived_in, village_id, avatar_url, public_profile";

  const { data: profile } = await supabase
    .from("profiles")
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  const person = profile as unknown as {
    id: string;
    full_name: string;
    headline: string | null;
    bio: string | null;
    business_name: string | null;
    industry: string | null;
    languages?: string[] | null;
    markets_known?: string[] | null;
    lived_in: string[] | null;
    can_help_with?: string | null;
    looking_for?: string | null;
    village_id: string | null;
    circle_id?: string | null;
    avatar_url: string | null;
    public_profile: boolean;
  } | null;

  if (!person) notFound();
  if (!me && !person.public_profile) notFound();

  const { data: village } = person.village_id
    ? await supabase
        .from("villages")
        .select("name, slug")
        .eq("id", person.village_id)
        .maybeSingle()
    : { data: null };

  const villageSlug = (village as { slug?: string } | null)?.slug ?? null;

  const sameVillage = Boolean(me) && person.village_id === me?.village_id;
  const canContact =
    Boolean(me) && person.id !== me?.id && (sameVillage || isPaid(me!));

  const { data: connection } =
    !me || person.id === me.id || sameVillage
      ? { data: null }
      : await supabase
          .from("connection_requests")
          .select("status, requester_id")
          .or(
            `and(requester_id.eq.${me!.id},recipient_id.eq.${person.id}),and(requester_id.eq.${person.id},recipient_id.eq.${me!.id})`
          )
          .maybeSingle();

  const country = null;

  // What a member may do about this person, in the order the prototype
  // puts it: the one action that matters, then share and report.
  let action: React.ReactNode;
  if (!me) {
    action = (
      <Link className="sp-cta" href="/apply">
        <Ic name="hand" />
        Request your invitation
      </Link>
    );
  } else if (person.id === me.id) {
    action = (
      <Link className="sp-cta sp-cta-glass" href="/me/edit">
        <Ic name="edit" />
        Edit profile
      </Link>
    );
  } else if (sameVillage) {
    action = (
      <Link className="sp-cta" href={`/messages/${person.id}`}>
        <Ic name="chat" />
        Message
      </Link>
    );
  } else if (connection?.status === "accepted") {
    action = (
      <Link className="sp-cta" href={`/messages/${person.id}`}>
        <Ic name="chat" />
        Open the thread
      </Link>
    );
  } else if (connection?.status === "pending") {
    action = (
      <span className="sp-cta sp-cta-soft">
        <Ic name="check" />
        {connection.requester_id === me.id ? "Request sent" : "They asked to connect"}
      </span>
    );
  } else if (canContact) {
    action = <ConnectionRequestForm recipientId={person.id} />;
  } else {
    action = (
      <Link className="sp-cta" href="/upgrade">
        <Ic name="lock" />
        Connect
      </Link>
    );
  }

  const relation =
    me && person.id === me.id
      ? "This is you"
      : sameVillage
        ? person.circle_id && person.circle_id === me?.circle_id
          ? "In your Circle"
          : "In your Village"
        : connection?.status === "accepted"
          ? "Connected"
          : null;

  const notice =
    me && person.id !== me.id && !sameVillage && !canContact ? (
      <div className="sp-notice">
        <Ic name="lock" />
        <span>
          <b>{person.full_name.split(" ")[0]} is in the {village?.name ?? "another"} Village.</b>{" "}
          Paid members can connect across Villages.
        </span>
        <Link className="sp-mini" href="/upgrade">
          See the paid plan
        </Link>
      </div>
    ) : null;

  return (
    <DualPage member={Boolean(me)} nav="/members" active="/discover">
      <div className={me ? "sp-stage" : "pubsec sp-stage"}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href={me ? "/directory" : "/members"}>{me ? "Directory" : "Members"}</Link>
          <Ic name="chev" />
          <span>{person.full_name}</span>
        </nav>

        <div className="sp-layout">
          <div>
            <ProfileView
              person={{ ...person, founding: null }}
              villageName={village?.name ?? null}
              villageSlug={villageSlug}
              circleName={null}
              country={country}
              relation={relation}
              publicView={!me}
              actions={
                <>
                  {action}
                  {me && person.id !== me.id ? (
                    <Link
                      className="sp-icon"
                      aria-label="Report"
                      href={`/report?member=${person.id}`}
                    >
                      <Ic name="flag" />
                    </Link>
                  ) : null}
                </>
              }
              notice={notice}
            />
          </div>

          <aside className="sp-aside">
            {person.business_name ? (
              <SideCard
                icon="briefcase"
                title={person.business_name}
                line={person.industry}
              />
            ) : null}
            {me ? null : (
              <div className="sp-side sp-join">
                <b className="sp-side-title">
                  Connect with {person.full_name.split(" ")[0]}
                </b>
                <span>Messaging and introductions are for members.</span>
                <Link className="sp-cta" href="/login">
                  Log in
                </Link>
                <Link className="sp-cta sp-cta-glass" href="/apply">
                  Request your invitation
                </Link>
              </div>
            )}
            <SideCard
              icon="shield"
              title="What is never shown"
              line="Email, phone and anything written for admins stay private."
            />
          </aside>
        </div>
      </div>
    </DualPage>
  );
}