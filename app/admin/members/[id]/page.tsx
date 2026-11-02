import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { ROLES_THAT_CARRY_MEMBERSHIP, STATUSES_IN_PLACE } from "@/lib/member";
import { money } from "@/lib/pricing";
import { MemberForm } from "../forms";
import { Crumbs } from "@/components/crumbs";

export default async function AdminMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const { isGlobal } = await requireAdmin();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("member_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!member) notFound();

  // The money is readable by the Global team only, which is what
  // subscriptions_own and payments_own in 0002 say, so a Local Admin
  // gets the verdict without the figures behind it.
  const [{ data: village }, { data: circles }, { data: roles }, subscription, payment] =
    await Promise.all([
      member.village_id
        ? supabase
            .from("villages")
            .select("name")
            .eq("id", member.village_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      member.village_id
        ? supabase
            .from("circle_capacity")
            .select("circle_id, name, places_left")
            .eq("village_id", member.village_id)
        : Promise.resolve({ data: [] }),
      supabase
        .from("member_roles")
        .select("role, scope")
        .eq("profile_id", id)
        .is("ended_at", null),
      isGlobal
        ? supabase
            .from("subscriptions")
            .select("status, current_period_end, cancel_at, created_at")
            .eq("profile_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      isGlobal
        ? supabase
            .from("payments")
            .select("amount_cents, currency, status, created_at")
            .eq("profile_id", id)
            .eq("kind", "membership")
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
    ]);

  // What is actually true about this person's access, said in words.
  //
  // Everything on this screen was a control and none of it was an
  // answer: Status, Plan and a Complimentary box, three fields that
  // between them decide nothing on their own. A Global Admin reading
  // "Plan: Member" took it to mean somebody had not subscribed and had
  // no access, when the global_admin role was carrying their membership
  // the whole time and unticking the box changed nothing.
  const held = (roles ?? []).map((r) => r.role as string);
  const carrying = held.filter((r) => ROLES_THAT_CARRY_MEMBERSHIP.includes(r));
  const inPlace = STATUSES_IN_PLACE.includes(member.status);

  let openness: string;
  let because: string;
  if (!inPlace) {
    openness = "Closed";
    because =
      member.status === "invited"
        ? "Invited and not started. They have their profile and nothing else until a membership begins."
        : `Marked ${member.status}. Nothing on the member side opens for them, whatever the plan says. Put the status back to open it again.`;
  } else if (member.plan === "paid") {
    openness = "Open";
    because = "They pay for it.";
  } else if (member.complimentary) {
    openness = "Open";
    because = member.complimentary_reason
      ? `Complimentary, given by hand. Reason on file: ${member.complimentary_reason}`
      : "Complimentary, given by hand, with no reason on file.";
  } else if (carrying.length) {
    openness = "Open";
    because = `The ${carrying.join(" and ")} role carries membership on its own. The Complimentary box below does not decide this, and unticking it changes nothing. End the role on the Leadership page to take the access away.`;
  } else {
    openness = "Closed";
    because =
      "No subscription, and nothing given by hand. They have their profile and the checkout.";
  }

  const lastPayment =
    ((payment?.data ?? []) as {
      amount_cents: number;
      currency: string;
      status: string;
      created_at: string;
    }[])[0] ?? null;

  const sub =
    (subscription?.data as {
      status: string;
      current_period_end: string | null;
      cancel_at: string | null;
    } | null) ?? null;

  const asDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // A full Circle was still listed here and still selectable, and
  // updateMember wrote circle_id with no check at all, so this was one of
  // the two paths that overfilled a Circle. The approval screen already
  // filtered; this one did not. The member's own Circle stays in the list
  // whatever its count, so saving the form does not silently move them.
  const options = (circles ?? [])
    .filter(
      (c) => (c.places_left as number) > 0 || c.circle_id === member.circle_id
    )
    .map((c) => ({
      id: c.circle_id as string,
      name: c.name as string,
      places_left: c.places_left as number,
    }));

  return (
    <main className="wrap">
      <section className="sec">
        <Crumbs trail={[["Members", "/admin/members"]]} />
        <h1>{member.full_name}</h1>
        <p className="lead">
          {member.headline || member.business_name || "Member"}.{" "}
          {village?.name ? `${village.name} Village.` : ""}
        </p>
        {done ? <div className="flag ok">Saved.</div> : null}
        <p>
          <Link className="btn btn-ghost" href={`/members/${id}`}>
            See their member profile
          </Link>
        </p>
      </section>

      <section className="sec">
        <div className="gside">
          <div className="panel">
            <h3>What they told us</h3>
            <dl className="kv">
              <dt>Email</dt>
              <dd>{member.email}</dd>
              <dt>Phone</dt>
              <dd>{member.phone || "Not given"}</dd>
              <dt>Business</dt>
              <dd>{member.business_name || "Not given"}</dd>
              <dt>Industry</dt>
              <dd>{member.industry || "Not given"}</dd>
              <dt>Nationalities</dt>
              <dd>{(member.nationalities ?? []).join(", ") || "Not given"}</dd>
              <dt>Languages</dt>
              <dd>{(member.languages ?? []).join(", ") || "Not given"}</dd>
              <dt>Can help with</dt>
              <dd>{member.can_help_with || "Not given"}</dd>
              <dt>Looking for</dt>
              <dd>{member.looking_for || "Not given"}</dd>
              <dt>Joined</dt>
              <dd>{member.joined_on || "Not recorded"}</dd>
              <dt>Roles</dt>
              <dd>
                {(roles ?? []).map((r) => r.role).join(", ") || "Member"}
              </dd>
            </dl>
          </div>

          {/* The right column is one grid child holding both, so the
              verdict sits above the controls instead of being auto
              placed into the next free cell under the left panel. */}
          <div className="stack">
          <div className="panel">
            <h3>Where this stands</h3>
            <dl className="kv">
              <dt>Member side</dt>
              <dd>
                <b>{openness}.</b> {because}
              </dd>
              {isGlobal ? (
                <>
                  <dt>Subscription</dt>
                  <dd>
                    {sub
                      ? `${sub.status}${
                          sub.current_period_end
                            ? `, next payment ${asDate(sub.current_period_end)}`
                            : ", no renewal date recorded"
                        }${sub.cancel_at ? `, cancelling on ${asDate(sub.cancel_at)}` : ""}`
                      : "Never subscribed."}
                  </dd>
                  <dt>Last membership payment</dt>
                  <dd>
                    {lastPayment
                      ? `${money(lastPayment.amount_cents, lastPayment.currency)} on ${asDate(
                          lastPayment.created_at
                        )}, ${lastPayment.status}`
                      : "None on record."}
                  </dd>
                </>
              ) : null}
            </dl>
          </div>

          <MemberForm
            id={id}
            circles={options}
            circleId={member.circle_id}
            status={member.status}
            plan={member.plan}
            complimentary={Boolean(member.complimentary)}
            complimentaryReason={member.complimentary_reason ?? null}
          />
          </div>
        </div>
      </section>
    </main>
  );
}