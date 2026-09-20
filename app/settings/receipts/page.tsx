import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";

export const metadata = { title: "Receipts, ExpatPreneurs Global" };

// Payment history for membership, events and learning, as the prototype
// specifies.
export default async function ReceiptsPage() {
  const member = await requireMember("/settings/receipts");
  const supabase = await createClient();

  const [{ data: payments }, { data: courses }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, kind, amount_cents, currency, status, created_at, event_id")
      .eq("profile_id", member.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("course_purchases")
      .select("id, amount_cents, currency, status, created_at, course_id")
      .eq("profile_id", member.id)
      .order("created_at", { ascending: false }),
  ]);

  const eventIds = [
    ...new Set((payments ?? []).map((p) => p.event_id).filter(Boolean)),
  ] as string[];
  const courseIds = [
    ...new Set((courses ?? []).map((c) => c.course_id).filter(Boolean)),
  ] as string[];

  const [{ data: events }, { data: courseRows }] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? supabase.from("courses").select("id, title").in("id", courseIds)
      : Promise.resolve({ data: [] }),
  ]);

  const rows = [
    ...(payments ?? []).map((p) => ({
      id: p.id,
      date: p.created_at,
      item:
        p.kind === "membership"
          ? "Paid membership"
          : p.kind === "event_ticket"
            ? `${events?.find((e) => e.id === p.event_id)?.title ?? "Event"} ticket`
            : p.kind,
      amount: `${(p.amount_cents / 100).toFixed(2)} ${p.currency}`,
      status: p.status,
    })),
    ...(courses ?? []).map((c) => ({
      id: c.id,
      date: c.created_at,
      item: courseRows?.find((r) => r.id === c.course_id)?.title ?? "A course",
      amount: `${(c.amount_cents / 100).toFixed(2)} ${c.currency}`,
      status: c.status,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <WorkspaceShell kind="member" nav="/settings/receipts">
        <section className="sec">
          <p className="muted small">
            <Link href="/settings?show=membership">Settings</Link>
          </p>
          <h1>Receipts</h1>
          <p className="lead">
            Membership, event tickets and anything you bought from Learning.
          </p>
        </section>

        <section className="sec">
          {rows.length === 0 ? (
            <p className="muted">Nothing paid for yet.</p>
          ) : (
            <div className="divide">
              {rows.map((row) => (
                <div className="li linkrow" key={row.id}>
                  <div>
                    <b>{row.item}</b>
                    <div className="muted small">
                      {new Date(row.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span className={`chip ${row.status === "paid" ? "chip-mint" : ""}`}>
                      {row.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="panel panel-wash" style={{ marginTop: 20 }}>
            <p className="muted small" style={{ margin: 0 }}>
              Invoices with your business details on them come from Stripe.
              Open the card portal from Membership to download them.
            </p>
          </div>
        </section>
      </WorkspaceShell>
  );
}