import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "The record, the Global team" };

// Plain words for what the log stores as machine names.
const plain: Record<string, string> = {
  "application.approved": "approved a request to join",
  "application.declined": "declined a request to join",
  "application.waitlisted": "put a request on the waiting list",
  "member.updated": "changed a membership",
  "member.left": "left the community",
  "member.transferred": "moved a member to another Village",
  "role.given": "gave a role",
  "role.ended": "ended a role",
  "report.handled": "handled a report",
  "event.cancelled": "called off an event",
  "session.cancelled": "called off a live room",
  "pod.approved": "approved a Pod",
  "article.written": "wrote a piece",
  "article.updated": "changed a piece",
  "course.approved": "approved a course",
  "course.refused": "refused a course",
  "course.pending": "sent a course back",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>;
}) {
  const { q = "", entity = "" } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, actor_id, action, entity, entity_id, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (entity) query = query.eq("entity", entity);
  if (q) query = query.ilike("action", `%${q}%`);

  const { data: entries } = await query;

  const ids = [
    ...new Set(
      [
        ...(entries ?? []).map((e) => e.actor_id),
        ...(entries ?? []).map((e) => (e.entity === "profile" ? e.entity_id : null)),
      ].filter(Boolean) as string[]
    ),
  ];

  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name").in("id", ids)
    : { data: [] };

  const nameOf = (id: string | null) =>
    people?.find((p) => p.id === id)?.full_name ?? "Somebody";

  const entities = ["profile", "event", "report", "live_session", "pod", "course", "article"];

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>The record</h1>
          <p className="lead">
            Who did what, and when. Decisions somebody may have to answer for
            later: memberships, roles, moderation, and anything called off.
          </p>

          <form className="searchrow" action="/global/audit" style={{ marginTop: 18 }}>
            {entity ? <input type="hidden" name="entity" value={entity} /> : null}
            <input name="q" defaultValue={q} placeholder="approved, role, cancelled" />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          <div className="tabs">
            <Link className={`chip ${entity ? "" : "mint"}`} href="/global/audit">
              Everything
            </Link>
            {entities.map((kind) => (
              <Link
                className={`chip ${entity === kind ? "mint" : ""}`}
                href={`/global/audit?entity=${kind}`}
                key={kind}
              >
                {kind.replace("_", " ")}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          {(entries ?? []).length === 0 ? (
            <p className="muted">Nothing recorded that matches.</p>
          ) : (
            <div className="rows">
              {(entries ?? []).map((entry) => (
                <div className="rowlink" key={entry.id}>
                  <div>
                    <b>
                      {nameOf(entry.actor_id)}{" "}
                      {plain[entry.action] ?? entry.action}
                      {entry.entity === "profile" && entry.entity_id !== entry.actor_id
                        ? `: ${nameOf(entry.entity_id)}`
                        : ""}
                    </b>
                    <div className="muted small">
                      {new Date(entry.created_at).toLocaleString("en-GB")},{" "}
                      {timeAgo(entry.created_at)}
                      {entry.meta && Object.keys(entry.meta).length
                        ? `. ${Object.entries(entry.meta as Record<string, unknown>)
                            .filter(([, v]) => v !== null && v !== "")
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span className="chip">{entry.entity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="panel wash" style={{ marginTop: 20 }}>
            <h3>What is not here</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Not everything that happens, only what somebody decided.
              Reading a page, opening a profile and searching the Directory
              are not recorded, and should not be: a log of what members look
              at is surveillance, not accountability.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}