import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { TransferButtons } from "./forms";

export const metadata = { title: "Moves, the Local Admin workspace" };

export default async function TransfersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: transfers }, { data: villages }] = await Promise.all([
    supabase
      .from("transfer_requests")
      .select("id, profile_id, from_village, to_village, moving_on, note, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("villages").select("id, name"),
  ]);

  const ids = [...new Set((transfers ?? []).map((t) => t.profile_id))];
  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name, email").in("id", ids)
    : { data: [] };

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Somewhere else";

  const open = (transfers ?? []).filter((t) => !["done", "declined"].includes(t.status));
  const settled = (transfers ?? []).filter((t) => ["done", "declined"].includes(t.status));

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin/members">Members</Link>
          </p>
          <h1>Moves</h1>
          <p className="lead">
            Members moving city. You see the ones coming to your Village and
            the ones leaving it, because a move is two Villages&apos; business.
          </p>
        </section>

        <section className="band">
          {open.length === 0 ? (
            <p className="muted">Nobody is moving at the moment.</p>
          ) : (
            <div className="stack">
              {open.map((transfer) => {
                const person = people?.find((p) => p.id === transfer.profile_id);
                return (
                  <div className="panel" key={transfer.id}>
                    <h3>{person?.full_name ?? "A member"}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {villageName(transfer.from_village)} to{" "}
                      {villageName(transfer.to_village)}
                      {transfer.moving_on ? `, around ${transfer.moving_on}` : ""}.
                      Asked {timeAgo(transfer.created_at)}.{" "}
                      <span className="chip">{transfer.status}</span>
                    </p>
                    {transfer.note ? (
                      <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                        {transfer.note}
                      </p>
                    ) : null}
                    <p className="muted small">
                      Moving them changes their Village and clears their
                      Circle, so the new Local Admins can place them. It also
                      puts them on the WhatsApp list to be taken out of the
                      old groups.
                    </p>
                    <TransferButtons id={transfer.id} />
                  </div>
                );
              })}
            </div>
          )}

          {settled.length ? (
            <div className="panel" style={{ marginTop: 20 }}>
              <h3>Settled</h3>
              <div className="rows" style={{ marginTop: 12 }}>
                {settled.map((transfer) => (
                  <div className="rowlink" key={transfer.id}>
                    <div>
                      <b>
                        {people?.find((p) => p.id === transfer.profile_id)
                          ?.full_name ?? "A member"}
                      </b>
                      <div className="muted small">
                        {villageName(transfer.from_village)} to{" "}
                        {villageName(transfer.to_village)}.{" "}
                        {timeAgo(transfer.created_at)}
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">{transfer.status}</span>
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