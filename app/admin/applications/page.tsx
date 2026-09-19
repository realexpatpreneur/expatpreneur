import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

const stages: Record<string, string[]> = {
  review: ["new", "with_local"],
  waitlist: ["waitlisted"],
  decided: ["approved", "declined", "recommended"],
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage = "review" } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, full_name, email, city, country, status, created_at, village_id")
    .in("status", stages[stage] ?? stages.review)
    .order("created_at", { ascending: false });

  const { data: villages } = await supabase.from("villages").select("id, name");
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "No Village yet";

  const rows = (applications ?? []).filter(
    (a) => admin.isGlobal || !a.village_id || admin.villageIds.includes(a.village_id)
  );

  return (
    <main className="wrap">
      <section className="band">
        <h1>Invitation requests</h1>
        <p className="lead">
          Every request is read by a person. Nothing here is automatic.
        </p>
        <div className="tabs">
          {[
            ["review", "To review"],
            ["waitlist", "Waitlist"],
            ["decided", "Decided"],
          ].map(([key, label]) => (
            <Link
              key={key}
              className={`chip ${stage === key ? "mint" : ""}`}
              href={`/admin/applications?stage=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="band">
        {rows.length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing here at the moment.
            </p>
          </div>
        ) : (
          <div className="rows">
            {rows.map((a) => (
              <Link
                className="rowlink"
                key={a.id}
                href={`/admin/applications/${a.id}`}
              >
                <div>
                  <b>{a.full_name}</b>
                  <div className="muted small">
                    {a.email}. {a.city}
                    {a.country ? `, ${a.country}` : ""}.
                  </div>
                </div>
                <div className="rowmeta">
                  <span className="chip">{villageName(a.village_id)}</span>
                  <span className="chip">{a.status.replace("_", " ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}