import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";

export const metadata = { title: "Resources library, the Global team" };

export default async function GlobalLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; village?: string }>;
}) {
  const { q = "", village = "" } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("id, title, description, kind, village_id, all_villages, url, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (village === "network") query = query.eq("all_villages", true);
  else if (village) query = query.eq("village_id", village);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const [{ data: resources }, { data: villages }] = await Promise.all([
    query,
    supabase.from("villages").select("id, name").order("name"),
  ]);

  const villageName = (id: string | null, all: boolean) =>
    all ? "Every Village" : villages?.find((v) => v.id === id)?.name ?? "No Village";

  return (
    <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Resources library</h1>
          <p className="lead">
            Everything shared with every Village, alongside what each Village
            keeps for itself.
          </p>

          <form className="searchrow" action="/global/library" style={{ marginTop: 18 }}>
            {village ? <input type="hidden" name="village" value={village} /> : null}
            <input name="q" defaultValue={q} placeholder="A title or a line from it" />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>

          <div className="tabs">
            <Link className={`chip ${village ? "" : "chip-mint"}`} href="/global/library">
              Everything
            </Link>
            <Link
              className={`chip ${village === "network" ? "chip-mint" : ""}`}
              href="/global/library?village=network"
            >
              Shared with every Village
            </Link>
            {(villages ?? []).map((v) => (
              <Link
                className={`chip ${village === v.id ? "chip-mint" : ""}`}
                href={`/global/library?village=${v.id}`}
                key={v.id}
              >
                {v.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {(resources ?? []).length === 0 ? (
            <p className="muted">Nothing matches that.</p>
          ) : (
            <div className="divide">
              {(resources ?? []).map((resource) => (
                <Link className="li linkrow" href="/library" key={resource.id}>
                  <div>
                    <b>{resource.title}</b>
                    <div className="muted small">
                      {resource.description}. {timeAgo(resource.created_at)}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span className="chip">{resource.kind}</span>
                    <span className={`chip ${resource.all_villages ? "chip-mint" : ""}`}>
                      {villageName(resource.village_id, resource.all_villages)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="panel panel-wash" style={{ marginTop: 20 }}>
            <h3>Sharing one with every Village</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              A resource marked for every Village is shared with all of them. Local
              Admins add their own in their workspace, and anything worth
              copying across the network belongs here.
            </p>
            <Link className="btn btn-ghost" href="/admin/resources">
              Add a resource
            </Link>
          </div>
        </section>
    </main>
  );
}