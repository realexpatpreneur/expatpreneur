import { DualPage } from "@/components/dual-page";
import { ProfileView, SideCard, type Row } from "@/components/profile-view";
import { Crumbs } from "@/components/crumbs";
import { Lock } from "@/components/lock";
import { Ic } from "@/components/icon";
import { readableDate } from "@/lib/labels";
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
    ? "id, full_name, headline, bio, business_name, industry, languages, markets_known, lived_in, can_help_with, looking_for, village_id, circle_id, avatar_url, public_profile, founding, joined_on"
    : "id, full_name, headline, bio, business_name, industry, lived_in, village_id, avatar_url, public_profile, founding";

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
    founding?: boolean | null;
    joined_on?: string | null;
  } | null;

  if (!person) notFound();
  if (!me && !person.public_profile) notFound();

  const { data: village } = person.village_id
    ? await supabase
        .from("villages")
        .select("name, slug, city, country")
        .eq("id", person.village_id)
        .maybeSingle()
    : { data: null };

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

  const villageCity = (village as { city?: string } | null)?.city ?? null;
  const country = (village as { country?: string } | null)?.country ?? null;

  // What a member may do about this person, in the order the prototype
  // puts it: the one action that matters, then share and report.
  let action: React.ReactNode;
  if (!me) {
    action = (
      <Link className="btn btn-primary" href="/apply">
        <Ic name="hand" />
        Request your invitation
      </Link>
    );
  } else if (person.id === me.id) {
    action = (
      <Link className="btn btn-primary" href="/me/edit">
        <Ic name="edit" />
        Edit profile
      </Link>
    );
  } else if (sameVillage) {
    action = (
      <Link className="btn btn-primary" href={`/messages/${person.id}`}>
        <Ic name="chat" />
        Message
      </Link>
    );
  } else if (connection?.status === "accepted") {
    action = (
      <Link className="btn btn-primary" href={`/messages/${person.id}`}>
        <Ic name="chat" />
        Open the thread
      </Link>
    );
  } else if (connection?.status === "pending") {
    action = (
      <span className="chip chip-blue">
        <Ic name="check" />
        {connection.requester_id === me.id ? "Request sent" : "They asked to connect"}
      </span>
    );
  } else if (canContact) {
    action = <ConnectionRequestForm recipientId={person.id} />;
  } else {
    action = (
      <Link className="btn btn-primary" href="/upgrade">
        <Ic name="lock" />
        Request to connect
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
      <div style={{ marginTop: 16 }}>
        <Lock note="Included with paid membership.">
          {person.full_name.split(" ")[0]} is in the{" "}
          {village?.name ?? "another"} Village. Paid members can send a
          connection request.
        </Lock>
      </div>
    ) : null;

  return (
    <DualPage member={Boolean(me)} nav="/members" active="/discover">
      <section className={me ? "sec" : "pubsec"}>
        <Crumbs
          trail={[
            [me ? "Directory" : "Members", me ? "/directory" : "/members"],
            [person.full_name],
          ]}
        />

        <ProfileView
          person={person}
          villageName={village?.name ?? null}
          villageCity={villageCity}
          country={country}
          circleName={relation === "In your Circle" ? "Your Circle" : null}
          publicView={!me}
          extraRows={
            person.joined_on
              ? [["Member since", readableDate(person.joined_on)] as Row]
              : undefined
          }
          actions={
            <>
              {action}
              {me && person.id !== me.id ? (
                <Link
                  className="btn btn-ghost"
                  aria-label="Report"
                  href={`/report?member=${person.id}`}
                >
                  <Ic name="flag" />
                </Link>
              ) : null}
            </>
          }
          notice={notice}
          aside={
            <>
              {person.business_name ? (
                <SideCard
                  title={person.business_name}
                  line={person.industry}
                  cta="View business"
                  href="/businesses"
                />
              ) : null}
              {me ? null : (
                <div className="panel">
                  <h3 style={{ fontSize: 14 }}>
                    Connect with {person.full_name.split(" ")[0]}
                  </h3>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    Messaging and introductions are for members.
                  </p>
                  <p className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                    <Link className="btn btn-primary btn-sm" href="/login">
                      Log in
                    </Link>
                    <Link className="btn btn-ghost btn-sm" href="/apply">
                      Request your invitation
                    </Link>
                  </p>
                </div>
              )}
            </>
          }
        />
      </section>
    </DualPage>
  );
}