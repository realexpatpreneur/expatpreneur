import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { VillageSettingsForm, ContactGlobalForm } from "./forms";

export const metadata = { title: "Village settings, the Local Admin workspace" };

// What is decided by the Global team rather than here, listed on the page
// so a Local Admin is never left wondering.
const decidedByGlobal = [
  "Membership plans and prices",
  "Network nationality ceiling",
  "Brand, domains and official channels",
  "Paid events, sponsors and partnerships",
  "Removing members in contested cases",
];

export default async function VillageSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: villages } = await supabase
    .from("villages")
    .select("id, name, timezone, visitor_places, summary")
    .in(
      "id",
      admin.villageIds.length
        ? admin.villageIds
        : ["00000000-0000-0000-0000-000000000000"]
    )
    .order("name");

  // The Local Admins of these Villages, which the prototype lists here.
  const { data: adminRoles } = await supabase
    .from("member_roles")
    .select("profile_id, scope_id")
    .eq("role", "local_admin")
    .is("ended_at", null)
    .in(
      "scope_id",
      admin.villageIds.length
        ? admin.villageIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const ids = [...new Set((adminRoles ?? []).map((r) => r.profile_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  return (
    <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/admin/members">The Local Admin workspace</Link>
          </p>
          <h1>Village settings</h1>
          <p className="lead">
            Settings a Local Admin can change. Anything touching brand, money
            or membership rules is a Global decision.
          </p>
        </section>

        <section className="sec">
          <div className="stack" style={{ maxWidth: 820 }}>
            {(villages ?? []).length === 0 ? (
              <p className="muted">You do not run a Village yet.</p>
            ) : (
              (villages ?? []).map((village) => (
                <VillageSettingsForm key={village.id} village={village} />
              ))
            )}

            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <h3>Your monthly recognition</h3>
                  <p className="muted small">
                    A thank you for the energy you give the Village. Amount to
                    be decided.
                  </p>
                </div>
                <span className="chip">Scheduled</span>
              </div>
            </div>

            <div className="panel">
              <h3>Local Admins</h3>
              <div className="divide" style={{ marginTop: 12 }}>
                {(adminRoles ?? []).map((role) => (
                  <div className="li linkrow" key={`${role.profile_id}-${role.scope_id}`}>
                    <div>
                      <b>
                        {people?.find((p) => p.id === role.profile_id)
                          ?.full_name ?? "A member"}
                      </b>
                      <div className="muted small">Local Admin</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="muted small" style={{ marginTop: 10 }}>
                Adding or removing a Local Admin is done by the Global team.
              </p>
            </div>

            <ContactGlobalForm />

            <div className="panel panel-wash">
              <h3>Decided by Global</h3>
              <ul>
                {decidedByGlobal.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
    </main>
  );
}