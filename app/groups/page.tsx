import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";

export const metadata = { title: "Industry Groups, ExpatPreneurs Global" };

export default async function GroupsPage() {
  const member = await requireMember("/groups");
  const supabase = await createClient();

  const [{ data: groups }, { data: sizes }, { data: mine }] = await Promise.all([
    supabase
      .from("industry_groups")
      .select("id, slug, name, industry, description, status, lead_id")
      .neq("status", "closed")
      .order("name"),
    supabase.from("group_sizes").select("group_id, members"),
    supabase.from("group_members").select("group_id").eq("profile_id", member.id),
  ]);

  const joined = new Set((mine ?? []).map((m) => m.group_id));
  const sizeOf = (id: string) =>
    sizes?.find((s) => s.group_id === id)?.members ?? 0;

  return (
    <WorkspaceShell kind="member" nav="/groups">
        <section className="band">
          <h1>Industry Groups</h1>
          <p className="lead">
            The people in your trade, across every Village. A restaurant in
            Dubai and one in Lisbon have more in common than either has with the
            software company next door.
          </p>
        </section>

        <section className="band">
          {(groups ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                None open yet. The Global team starts these once there are
                enough members in a trade.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(groups ?? []).map((group) => (
                <Link className="panel" key={group.id} href={`/groups/${group.slug}`}>
                  <span className="chip">{group.industry}</span>
                  <h3 style={{ marginTop: 10 }}>{group.name}</h3>
                  <p className="muted small">{group.description}</p>
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    {sizeOf(group.id)} members
                    {joined.has(group.id) ? ". You are in this one." : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}