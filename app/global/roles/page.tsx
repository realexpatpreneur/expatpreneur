import { createClient } from "@/lib/supabase/server";
import { RoleForm, EndRole } from "../forms";

export default async function GlobalRolesPage() {
  const supabase = await createClient();

  const [{ data: roles }, { data: people }, { data: villages }] =
    await Promise.all([
      supabase
        .from("member_roles")
        .select("id, profile_id, role, scope, scope_id, starts_on, review_on")
        .is("ended_at", null)
        .order("starts_on", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, village_id")
        .in("status", ["active", "onboarding"])
        .order("full_name")
        .limit(300),
      supabase.from("villages").select("id, name").order("name"),
    ]);

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Global";

  const label: Record<string, string> = {
    local_admin: "Local Admin",
    global_admin: "Global Admin",
    circle_host: "Circle Host",
    industry_lead: "Industry Lead",
    pod_lead: "Pod Lead",
    educator: "Educator",
    media: "Media",
  };

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Roles</h1>
        <p className="lead">
          Who holds what, and until when. Roles are reviewed once a year, not
          held forever.
        </p>
      </section>

      <section className="sec">
        <div className="gside">
          <div>
            {(roles ?? []).length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  Nobody holds a role yet.
                </p>
              </div>
            ) : (
              <div className="divide">
                {(roles ?? []).map((role) => (
                  <div className="li linkrow" key={role.id}>
                    <div>
                      <b>{nameOf(role.profile_id)}</b>
                      <div className="muted small">
                        {label[role.role] ?? role.role}.{" "}
                        {villageName(role.scope_id)}. Since {role.starts_on}
                        {role.review_on ? `, review ${role.review_on}` : ""}.
                      </div>
                    </div>
                    <div className="rowmeta">
                      <EndRole roleId={role.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <RoleForm people={people ?? []} villages={villages ?? []} />
        </div>
      </section>
    </main>
  );
}