import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SuggestLeaderForm } from "./forms";

export const metadata = { title: "Leadership, the Local Admin workspace" };

const roleLabel: Record<string, string> = {
  circle_host: "Circle Host",
  industry_lead: "Industry Lead",
  pod_lead: "Pod Lead",
  educator: "Educator",
  local_admin: "Local Admin",
};

export default async function LeadershipPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageIds = admin.villageIds.length
    ? admin.villageIds
    : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: members }, { data: suggestions }, { data: roles }] =
    await Promise.all([
      supabase
        .from("member_records")
        .select("id, full_name, headline, village_id, joined_on")
        .in("village_id", villageIds)
        .eq("status", "active")
        .order("full_name"),
      supabase
        .from("leadership_suggestions")
        .select("id, profile_id, role, why, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("member_roles")
        .select("profile_id, role")
        .is("ended_at", null),
    ]);

  const nameOf = (id: string) =>
    members?.find((m) => m.id === id)?.full_name ?? "A member";

  const holds = (id: string) =>
    (roles ?? [])
      .filter((r) => r.profile_id === id)
      .map((r) => roleLabel[r.role] ?? r.role);

  // Members who already run something are the first place to look for
  // somebody who could run more.
  const doing = (members ?? []).filter((m) => holds(m.id).length > 0);

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin">Overview</Link>
          </p>
          <h1>Leadership</h1>
          <p className="lead">
            Members who could take on more, when they want to.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>Already running something</h3>
                {doing.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody holds a role in your Village yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {doing.map((member) => (
                      <Link
                        className="rowlink"
                        href={`/admin/members/${member.id}`}
                        key={member.id}
                      >
                        <div>
                          <b>{member.full_name}</b>
                          <div className="muted small">{member.headline}</div>
                        </div>
                        <div className="rowmeta">
                          {holds(member.id).map((role) => (
                            <span className="chip mint" key={role}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Put forward</h3>
                {(suggestions ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(suggestions ?? []).map((suggestion) => (
                      <div className="rowlink" key={suggestion.id}>
                        <div>
                          <b>{nameOf(suggestion.profile_id)}</b>
                          <div className="muted small">
                            {roleLabel[suggestion.role] ?? suggestion.role}.{" "}
                            {suggestion.why ?? ""} {timeAgo(suggestion.created_at)}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${
                              suggestion.status === "actioned" ? "mint" : ""
                            }`}
                          >
                            {suggestion.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <SuggestLeaderForm members={members ?? []} />

              <div className="panel wash">
                <h3>How this works</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Roles are given by the Global team, so this is a
                  suggestion. The member is not told they were put forward,
                  which means nobody is left disappointed by a role that
                  never arrives.
                </p>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}