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
        .select("name, slug, cover_url")
        .eq("id", person.village_id)
        .maybeSingle()
    : { data: null };

  const villageCover =
    (village as { cover_url?: string | null } | null)?.cover_url ?? null;

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
  // The request form is a few lines to write, so in the member view it
  // sits under the buttons rather than in the row with them.
  let actionIsForm = false;
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
    actionIsForm = true;
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
          Village Members can connect across Villages.
        </span>
        <Link className="sp-mini" href="/upgrade">
          See Village Membership
        </Link>
      </div>
    ) : null;

  // The member view, in the member space's own design: the person first,
  // big, then what they can help with and what they are looking for.
  if (me) {
    const [circleRes, postsRes] = await Promise.all([
      person.circle_id
        ? supabase.from("circles").select("name").eq("id", person.circle_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("asks")
        .select("id, kind, title, status, created_at, reach")
        .eq("author_id", person.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    const circleName = (circleRes.data as { name?: string } | null)?.name ?? null;
    const recent = postsRes.data ?? [];
    const first = person.full_name.split(" ")[0];
    const lived = (person.lived_in ?? []).filter(Boolean);
    const initials = person.full_name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");
    const place = [village?.name ? `${village.name} Village` : null, circleName]
      .filter(Boolean)
      .join(", ");

    return (
      <DualPage member nav="/members" active="/discover">
        <nav className="m-crumb" aria-label="Breadcrumb">
          <Link href="/directory">Directory</Link>
          <span>/</span>
          <span>{person.full_name}</span>
        </nav>

        <section className="m-phero">
          <div className="m-portrait">
            {person.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={person.avatar_url} alt={person.full_name} />
            ) : (
              <span className="m-big" style={{ background: "#E6F4F1" }}>{initials}</span>
            )}
          </div>
          <div>
            {place || relation ? (
              <span className="m-kind" style={{ color: "#2F8F77" }}>
                {[place, relation].filter(Boolean).join(". ")}
              </span>
            ) : null}
            <h1>{person.full_name}</h1>
            {person.headline || person.business_name ? (
              <p style={{ margin: "8px 0 0", fontSize: 18, color: "#3B4650" }}>
                {person.headline ?? person.business_name}
              </p>
            ) : null}
            {lived.length || village?.name ? (
              <div className="m-route">
                {lived.map((p) => (
                  <span key={p} style={{ display: "contents" }}>
                    <span>{p}</span>
                    <i>/</i>
                  </span>
                ))}
                {village?.name ? <span className="now">{village.name}, now</span> : null}
              </div>
            ) : null}
            {person.languages?.length ? (
              <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
                Works in {person.languages.join(", ").replace(/, ([^,]*)$/, " and $1")}.
              </p>
            ) : null}
            <div className="m-pacts">
              {actionIsForm ? null : action}
              {person.id !== me.id ? (
                <Link className="sp-icon" aria-label="Report" href={`/report?member=${person.id}`}>
                  <Ic name="flag" />
                </Link>
              ) : null}
            </div>
            {actionIsForm ? (
              <div className="m-card" style={{ marginTop: 18, maxWidth: 540 }}>
                {action}
              </div>
            ) : null}
            {notice ? <div style={{ marginTop: 24, maxWidth: 560 }}>{notice}</div> : null}
          </div>
        </section>

        <div className="m-pcols">
          <div style={{ minWidth: 0 }}>
            {person.bio ? (
              <>
                <h2 className="m-h2">About</h2>
                <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: "#3B4650", maxWidth: "62ch", whiteSpace: "pre-line" }}>
                  {person.bio}
                </p>
              </>
            ) : null}

            <div className="m-two" style={{ marginTop: person.bio ? 28 : 0 }}>
              <div className="m-need">
                <span className="m-kind m-offer">Can help with</span>
                <p>{person.can_help_with || <span className="m-muted">Not said yet</span>}</p>
              </div>
              <div className="m-need">
                <span className="m-kind m-ask">Looking for</span>
                <p>{person.looking_for || <span className="m-muted">Not said yet</span>}</p>
              </div>
            </div>

            {person.business_name ? (
              <>
                <h2 className="m-h2" style={{ marginTop: 44 }}>
                  {person.id === me.id ? "Your business" : `${first}'s business`}
                </h2>
                <div className="m-biz">
                  <span className="m-bizmark">{person.business_name.slice(0, 1)}</span>
                  <span style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "22px 24px" }}>
                    {person.industry ? <span className="m-kind m-muted">{person.industry}</span> : null}
                    <b style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{person.business_name}</b>
                  </span>
                </div>
              </>
            ) : null}

            {recent.length ? (
              <>
                <h2 className="m-h2" style={{ marginTop: 44 }}>Recently on Ask &amp; Offer</h2>
                <div className="m-ao" style={{ marginTop: 12 }}>
                  {recent.map((r) => (
                    <Link key={r.id} className="m-aorow" href={`/village/${r.id}`}>
                      <span className={`m-tag ${r.kind === "offer" ? "offer" : r.kind === "introduction" ? "introduction" : "ask"}`}>
                        {r.kind === "offer" ? "Offer" : r.kind === "introduction" ? "Hello" : "Ask"}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <b>{r.title}</b>
                        <span className="m-aometa">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                        </span>
                      </span>
                      <span className="m-status" style={{ color: r.status === "open" ? "#24675A" : "#6B7683" }}>
                        {r.status === "open" ? "Open" : "Resolved"}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside style={{ display: "grid", gap: 20 }}>
            <div className="m-card">
              <h3>Details</h3>
              <dl className="m-dl">
                {village?.name ? (
                  <>
                    <dt>Village</dt>
                    <dd>{village.name}</dd>
                  </>
                ) : null}
                {circleName ? (
                  <>
                    <dt>Circle</dt>
                    <dd>{circleName}</dd>
                  </>
                ) : null}
                {person.industry ? (
                  <>
                    <dt>Industry</dt>
                    <dd>{person.industry}</dd>
                  </>
                ) : null}
                {person.markets_known?.length ? (
                  <>
                    <dt>Markets</dt>
                    <dd>{person.markets_known.join(", ")}</dd>
                  </>
                ) : null}
                {person.languages?.length ? (
                  <>
                    <dt>Languages</dt>
                    <dd>{person.languages.join(", ")}</dd>
                  </>
                ) : null}
              </dl>
            </div>
            <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
              <h3>What is never shown</h3>
              <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5 }}>
                Email, phone and anything written for admins stay private.
              </p>
            </div>
          </aside>
        </div>
      </DualPage>
    );
  }

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
              villageCover={villageCover}
              circleName={null}
              country={country}
              relation={relation}
              publicView={!me}
              actions={
                <>
                  {/* Members get the report link in their own view above. */}
                  {action}
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