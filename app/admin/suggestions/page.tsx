import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";

export const metadata = { title: "Suggestion box, Admin" };

const statusLabel: Record<string, string> = {
  new: "New",
  read: "Read",
  discussing: "Being discussed",
  actioned: "Actioned",
  not_now: "Not for now",
};

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("suggestions")
    .select("id, title, about, anonymous, author_id, status, created_at, village_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (show === "new") query = query.eq("status", "new");
  if (show === "anonymous") query = query.eq("anonymous", true);

  const { data: suggestions } = await query;

  const authorIds = [
    ...new Set((suggestions ?? []).map((s) => s.author_id).filter(Boolean)),
  ] as string[];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] };

  const counts = {
    total: (suggestions ?? []).length,
    fresh: (suggestions ?? []).filter((s) => s.status === "new").length,
    anonymous: (suggestions ?? []).filter((s) => s.anonymous).length,
  };

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Suggestion box</h1>
        <p className="lead">
          What members would change. Read them together at the monthly admin
          call.
        </p>
        <p>
          <span className="chip">{counts.total} in view</span>{" "}
          <span className="chip chip-blue">{counts.fresh} new</span>{" "}
          <span className="chip">{counts.anonymous} anonymous</span>
        </p>
        <div className="tabs">
          {[
            ["all", "All"],
            ["new", "New"],
            ["anonymous", "Anonymous"],
          ].map(([key, label]) => (
            <Link
              key={key}
              className={`chip ${show === key ? "chip-mint" : ""}`}
              href={`/admin/suggestions?show=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="sec">
        {(suggestions ?? []).length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing here at the moment.
            </p>
          </div>
        ) : (
          <div className="divide">
            {(suggestions ?? []).map((s) => (
              <Link className="li linkrow" key={s.id} href={`/admin/suggestions/${s.id}`}>
                <div>
                  <b>{s.title}</b>
                  <div className="muted small">
                    {s.anonymous
                      ? "Anonymous"
                      : authors?.find((a) => a.id === s.author_id)?.full_name ??
                        "A member"}
                    . {s.about === "community" ? "The whole community" : "Village"}.{" "}
                    {timeAgo(s.created_at)}.
                  </div>
                </div>
                <div className="rowmeta">
                  <span className={`chip ${s.status === "new" ? "chip-blue" : ""}`}>
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="panel panel-wash" style={{ marginTop: 16 }}>
          <p className="muted small" style={{ margin: 0 }}>
            Anonymous suggestions carry no name, no email and no Circle, so
            there is nobody to go back to. Judge them on what they say.
          </p>
        </div>
      </section>
    </main>
  );
}