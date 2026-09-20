import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { AnnouncementForm } from "../members/forms";

export const metadata = { title: "Announcements, Admin" };

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: announcements }, { data: village }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, audience, sent_at, created_at, village_id")
      .order("created_at", { ascending: false })
      .limit(30),
    admin.homeVillageId
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", admin.homeVillageId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const rows = (announcements ?? []).filter(
    (a) => admin.isGlobal || !a.village_id || admin.villageIds.includes(a.village_id)
  );

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Announcements</h1>
        <p className="lead">
          One message to the Village. Used sparingly, it gets read.
        </p>
        {done ? <div className="flag ok">Sent.</div> : null}
      </section>

      <section className="sec">
        <div className="gside">
          <AnnouncementForm villageName={village?.name ?? null} />
          <div className="stack">
            <div className="panel">
              <h3>Sent recently</h3>
              {rows.length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing yet.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {rows.map((row) => (
                    <div className="li linkrow" key={row.id}>
                      <div>
                        <b>{row.title}</b>
                        <div className="muted small">
                          {row.body.slice(0, 80)}
                          {row.body.length > 80 ? "..." : ""}
                        </div>
                        <div className="muted small">
                          {timeAgo(row.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="panel panel-wash">
              <h3>A word on frequency</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                One a week at most. Everything else belongs in Ask and Offer or
                in the WhatsApp group.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}