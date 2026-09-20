import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { VillageSettingsForm, ContactGlobalForm } from "./forms";

export const metadata = { title: "Village settings, the Local Admin workspace" };

export default async function VillageSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: villages } = await supabase
    .from("villages")
    .select("id, name, summary, welcome_message, whatsapp_url, meeting_note, quiet_days")
    .in("id", admin.villageIds.length ? admin.villageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin/members">The Local Admin workspace</Link>
          </p>
          <h1>Village settings</h1>
          <p className="lead">
            What you can change about your own Village. Its name, its city and
            whether it is open stay with the Global team.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              {(villages ?? []).length === 0 ? (
                <p className="muted">
                  You do not run a Village yet.
                </p>
              ) : (
                (villages ?? []).map((village) => (
                  <VillageSettingsForm key={village.id} village={village} />
                ))
              )}
            </div>

            <div className="stack">
              <ContactGlobalForm />

              <div className="panel wash">
                <h3>What lives elsewhere</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Circles and their WhatsApp groups are on the Circles page.
                  Who holds a role is with the Global team. Your own profile
                  and what reaches your inbox are in your settings.
                </p>
                <Link className="btn" href="/admin/circles">
                  Circles
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}