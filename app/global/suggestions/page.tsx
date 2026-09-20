import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";

const statusLabel: Record<string, string> = {
  new: "New",
  read: "Read",
  discussing: "Being discussed",
  actioned: "Actioned",
  not_now: "Not for now",
};

export default async function GlobalSuggestionsPage() {
  const supabase = await createClient();

  const [{ data: suggestions }, { data: villages }] = await Promise.all([
    supabase
      .from("suggestions")
      .select("id, title, about, anonymous, author_id, status, to_global, created_at, village_id")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("villages").select("id, name"),
  ]);

  const ids = [
    ...new Set((suggestions ?? []).map((s) => s.author_id).filter(Boolean)),
  ] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Every Village";

  return (
    <main className="wrap">
      <section className="band">
        <h1>Suggestion box, everywhere</h1>
        <p className="lead">
          What members across the network would change. The same thing said in
          three cities is worth acting on.
        </p>
      </section>

      <section className="band">
        {(suggestions ?? []).length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet.
            </p>
          </div>
        ) : (
          <div className="rows">
            {(suggestions ?? []).map((s) => (
              <Link className="rowlink" key={s.id} href={`/admin/suggestions/${s.id}`}>
                <div>
                  <b>{s.title}</b>
                  <div className="muted small">
                    {s.anonymous
                      ? "Anonymous"
                      : people?.find((p) => p.id === s.author_id)?.full_name ??
                        "A member"}
                    . {villageName(s.village_id)}. {timeAgo(s.created_at)}.
                  </div>
                </div>
                <div className="rowmeta">
                  {s.to_global ? <span className="chip blue">For Global</span> : null}
                  <span className="chip">{statusLabel[s.status] ?? s.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}