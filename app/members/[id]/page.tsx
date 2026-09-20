import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
        .select("name")
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

  return (
    <>
      <SiteHeader signedIn={Boolean(me)} />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href={me ? "/directory" : "/members"}>
              {me ? "Directory" : "Members"}
            </Link>
          </p>
          <div className="facerow">
            {person.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="face big" src={person.avatar_url} alt="" />
            ) : null}
            <h1 style={{ margin: 0 }}>{person.full_name}</h1>
          </div>
          <p className="lead">
            {person.headline || person.business_name || "Member"}
          </p>
          <p>
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {person.industry ? <span className="chip">{person.industry}</span> : null}
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>About</h3>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                {person.bio || "Nothing written yet."}
              </p>
              <dl className="kv">
                <dt>Business</dt>
                <dd>{person.business_name || "Not given"}</dd>
                {me ? (
                  <>
                    <dt>Can help with</dt>
                    <dd>{person.can_help_with || "Not given"}</dd>
                    <dt>Looking for</dt>
                    <dd>{person.looking_for || "Not given"}</dd>
                  </>
                ) : null}
                {me ? (
                  <>
                    <dt>Languages</dt>
                    <dd>{(person.languages ?? []).join(", ") || "Not given"}</dd>
                    <dt>Markets they know</dt>
                    <dd>{(person.markets_known ?? []).join(", ") || "Not given"}</dd>
                  </>
                ) : null}
                <dt>Where they have lived</dt>
                <dd>{(person.lived_in ?? []).join(", ") || "Not given"}</dd>
              </dl>
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Getting in touch</h3>
                {!me ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Members write to each other inside the platform. There is
                      no way to reach somebody from out here, which is the
                      point of it.
                    </p>
                    <Link className="btn primary" href="/apply">
                      Request an invitation
                    </Link>
                  </>
                ) : person.id === me.id ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      This is your own profile.
                    </p>
                    <Link className="btn" href="/settings">
                      Edit your profile
                    </Link>
                  </>
                ) : sameVillage ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      You are in the same Village, so you can write to them
                      directly.
                    </p>
                    <Link className="btn primary" href={`/messages/${person.id}`}>
                      Send a message
                    </Link>
                  </>
                ) : connection?.status === "accepted" ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      They accepted your request, so the thread is open.
                    </p>
                    <Link className="btn primary" href={`/messages/${person.id}`}>
                      Open the thread
                    </Link>
                  </>
                ) : connection?.status === "pending" ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {connection.requester_id === me.id
                      ? "Your request is with them."
                      : "They asked to connect. Answer it from Messages."}
                  </p>
                ) : canContact ? (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      They are in another Village, so it starts with a request.
                    </p>
                    <ConnectionRequestForm recipientId={person.id} />
                  </>
                ) : (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Reaching members in other Villages is part of the paid plan.
                  </p>
                )}
              </div>
              {!me || person.id === me.id ? null : (
                <div className="panel wash">
                  <h3>Something wrong?</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    If this member has done something that should not have
                    happened, tell your Local Admin. It is handled quietly.
                  </p>
                  <Link className="btn" href={`/report?member=${person.id}`}>
                    Report
                  </Link>
                </div>
              )}
              <div className="panel wash">
                <h3>What is never shown</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Email, phone and anything a member wrote for admins stay
                  private. What you see here is what they chose to show.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      {me ? null : <SiteFooter />}
    </>
  );
}