import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { PartnerDecision } from "./forms";

export const metadata = { title: "Partnered events, the Global team" };

export default async function PartneredEventsPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: requests }, { data: villages }] = await Promise.all([
    supabase
      .from("partnered_events")
      .select("id, title, partner, partner_gets, members_get, conditions, status, village_id, proposed_by, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("villages").select("id, name"),
  ]);

  const ids = [
    ...new Set((requests ?? []).map((r) => r.proposed_by).filter(Boolean)),
  ] as string[];
  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name").in("id", ids)
    : { data: [] };

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const waiting = (requests ?? []).filter((r) => r.status === "new");
  const settled = (requests ?? []).filter((r) => r.status !== "new");

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Partnered events</h1>
          <p className="lead">
            Sponsorships and co-branded events are approved here before
            anything is agreed with a partner.
          </p>
        </section>

        <section className="band">
          {waiting.length === 0 ? (
            <p className="muted">Nothing waiting.</p>
          ) : (
            <div className="stack">
              {waiting.map((request) => (
                <div className="panel" key={request.id}>
                  <h3>{request.title}</h3>
                  <dl className="kv">
                    <dt>Village</dt>
                    <dd>{villageName(request.village_id)}</dd>
                    <dt>Partner</dt>
                    <dd>{request.partner}</dd>
                    <dt>Partner gets</dt>
                    <dd>{request.partner_gets}</dd>
                    <dt>Members get</dt>
                    <dd>{request.members_get}</dd>
                    <dt>Proposed by</dt>
                    <dd>
                      {people?.find((p) => p.id === request.proposed_by)
                        ?.full_name ?? "A Local Admin"}
                      , {timeAgo(request.created_at)}
                    </dd>
                  </dl>
                  <PartnerDecision id={request.id} conditions={request.conditions} />
                </div>
              ))}
            </div>
          )}

          {settled.length ? (
            <div className="panel" style={{ marginTop: 20 }}>
              <h3>Decided</h3>
              <div className="rows" style={{ marginTop: 12 }}>
                {settled.map((request) => (
                  <div className="rowlink" key={request.id}>
                    <div>
                      <b>{request.title}</b>
                      <div className="muted small">
                        {request.partner}. {villageName(request.village_id)}.{" "}
                        {request.conditions ?? "No conditions recorded."}
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span
                        className={`chip ${request.status === "approved" ? "mint" : ""}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
    </main>
  );
}