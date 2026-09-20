import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";

export const metadata = { title: "Resources, ExpatPreneurs Global" };

const kindLabel: Record<string, string> = {
  guide: "Guide",
  template: "Template",
  recording: "Recording",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await requireMember("/library");
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("id, title, kind, description, url, all_villages, village_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (show !== "all") query = query.eq("kind", show);

  const [{ data: resources }, { data: villages }] = await Promise.all([
    query,
    supabase.from("villages").select("id, name"),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? null;

  return (
    <WorkspaceShell kind="member" nav="/library">
        <section className="sec">
          <h1>Resources</h1>
          <p className="lead">
            What members worked out the hard way, written down so the next
            person does not have to.
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["guide", "Guides"],
              ["template", "Templates"],
              ["recording", "Recordings"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/library?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {(resources ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing here yet. Your Local Admin adds these as the Village
                gathers them.
              </p>
            </div>
          ) : (
            <div className="g3">
              {(resources ?? []).map((resource) => (
                <div className="panel" key={resource.id}>
                  <span className="chip">{kindLabel[resource.kind] ?? resource.kind}</span>
                  <h3 style={{ marginTop: 10 }}>{resource.title}</h3>
                  <p className="muted small">{resource.description}</p>
                  <p className="muted small">
                    {resource.all_villages
                      ? "Every Village"
                      : villageName(resource.village_id) ?? "Your Village"}
                  </p>
                  {resource.url ? (
                    <a
                      className="btn btn-ghost"
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {!isPaid(member) ? (
            <div className="panel panel-wash" style={{ marginTop: 16 }}>
              <h3>Resources from other Villages</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                What Dubai learned about licensing is not much use in Lisbon,
                but some of it travels. The paid plan opens every Village's
                library.
              </p>
              <Link className="btn btn-ghost" href="/upgrade">
                See the paid plan
              </Link>
            </div>
          ) : null}
        </section>
      </WorkspaceShell>
  );
}