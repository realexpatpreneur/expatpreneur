import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { MemberForm } from "../forms";

export default async function AdminMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!member) notFound();

  const [{ data: village }, { data: circles }, { data: roles }] =
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
    ]);

  const options = (circles ?? []).map((c) => ({
    id: c.circle_id as string,
    name: c.name as string,
    places_left: c.places_left as number,
  }));

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/members">Members</Link>
        </p>
        <h1>{member.full_name}</h1>
        <p className="lead">
          {member.headline || member.business_name || "Member"}.{" "}
          {village?.name ? `${village.name} Village.` : ""}
        </p>
        {done ? <div className="notice good">Saved.</div> : null}
        <p>
          <Link className="btn" href={`/members/${id}`}>
            See their member profile
          </Link>
        </p>
      </section>

      <section className="band">
        <div className="cols">
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

          <MemberForm
            id={id}
            circles={options}
            circleId={member.circle_id}
            status={member.status}
            plan={member.plan}
          />
        </div>
      </section>
    </main>
  );
}