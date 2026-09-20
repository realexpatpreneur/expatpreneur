import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { ResourceForm } from "./forms";

export const metadata = { title: "Resources, Admin" };

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (resources ?? []).filter(
    (r) =>
      admin.isGlobal ||
      r.all_villages ||
      (r.village_id && admin.villageIds.includes(r.village_id))
  );

  return (
    <main className="wrap">
      <section className="band">
        <h1>Resources</h1>
        <p className="lead">
          Guides, templates and recordings for your Village. Keep them few and
          useful.
        </p>
        {done ? <div className="notice good">Saved.</div> : null}
      </section>

      <section className="band">
        <div className="cols">
          <div className="stack">
            {rows.length === 0 ? (
              <div className="panel wash">
                <p className="muted" style={{ margin: 0 }}>
                  Nothing yet. Add the first one.
                </p>
              </div>
            ) : (
              rows.map((resource) => (
                <ResourceForm key={resource.id} resource={resource} />
              ))
            )}
          </div>
          <ResourceForm />
        </div>
      </section>
    </main>
  );
}