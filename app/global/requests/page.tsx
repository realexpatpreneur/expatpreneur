import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { PodDecision, DataDecision } from "./forms";

export const metadata = { title: "Requests, the Global team" };

export default async function GlobalRequestsPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: proposals }, { data: dataRequests }, { data: villages }] =
    await Promise.all([
      supabase
        .from("pod_proposals")
        .select("id, proposer_id, village_id, name, purpose, cadence, ends_on, status, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("data_requests")
        .select("id, profile_id, kind, status, note, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("villages").select("id, name"),
    ]);

  const ids = [
    ...new Set([
      ...(proposals ?? []).map((p) => p.proposer_id),
      ...(dataRequests ?? []).map((r) => r.profile_id),
    ]),
  ];
  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name, email").in("id", ids)
    : { data: [] };

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const openPods = (proposals ?? []).filter(
    (p) => !["actioned", "not_now"].includes(p.status)
  );
  const openData = (dataRequests ?? []).filter(
    (r) => !["done", "refused"].includes(r.status)
  );

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Requests</h1>
          <p className="lead">
            Pods members want to start, and members asking about their own
            data. Both have somebody waiting at the other end.
          </p>
        </section>

        <section className="band">
          <h2>Pods proposed</h2>
          {openPods.length === 0 ? (
            <p className="muted small">Nothing waiting.</p>
          ) : (
            <div className="stack" style={{ marginTop: 16 }}>
              {openPods.map((proposal) => (
                <div className="panel" key={proposal.id}>
                  <h3>{proposal.name}</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {nameOf(proposal.proposer_id)}
                    {villageName(proposal.village_id)
                      ? `, ${villageName(proposal.village_id)}`
                      : ""}
                    . {proposal.cadence}
                    {proposal.ends_on ? `, until ${proposal.ends_on}` : ""}.{" "}
                    {timeAgo(proposal.created_at)}.{" "}
                    <span className="chip">{proposal.status}</span>
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                    {proposal.purpose}
                  </p>
                  <p className="muted small">
                    Making it creates the Pod with them as its lead, and puts
                    them in it.
                  </p>
                  <PodDecision id={proposal.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="band">
          <h2>Members asking about their own data</h2>
          {openData.length === 0 ? (
            <p className="muted small">Nothing waiting.</p>
          ) : (
            <div className="stack" style={{ marginTop: 16 }}>
              {openData.map((request) => (
                <div className="panel" key={request.id}>
                  <h3>
                    {request.kind === "delete"
                      ? "Asking for their data to be removed"
                      : "Asking for a copy of their data"}
                  </h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {nameOf(request.profile_id)}.{" "}
                    {people?.find((p) => p.id === request.profile_id)?.email}.{" "}
                    {timeAgo(request.created_at)}.{" "}
                    <span className="chip">{request.status}</span>
                  </p>
                  {request.note ? (
                    <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                      {request.note}
                    </p>
                  ) : null}
                  <p className="muted small">
                    A copy is put together by hand for now and sent to that
                    address. Removal means the profile, the posts and the
                    messages, and it cannot be undone.
                  </p>
                  <DataDecision id={request.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}