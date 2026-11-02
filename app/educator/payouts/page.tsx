import { WorkspaceShell } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Payouts, your courses" };

export default async function PayoutsPage() {
  const member = await requireMember("/educator/payouts");
  const supabase = await createClient();

  const [{ data: payouts }, { data: sales }, { data: share }] = await Promise.all([
    supabase
      .from("payouts")
      .select("id, period_start, period_end, gross_cents, share, net_cents, currency, status, reference, paid_at")
      .eq("person_id", member.id)
      .eq("kind", "course")
      .order("period_start", { ascending: false }),
    supabase
      .from("course_sales")
      .select("educator_cents, currency, status, created_at")
      .eq("educator_id", member.id)
      .eq("status", "paid"),
    supabase.from("settings").select("value").eq("key", "educator_share").maybeSingle(),
  ]);

  const money = (cents: number, currency = "EUR") =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });

  // These three figures were each a single number printed as euros,
  // summed across every currency: a sale in AED and one in EUR added
  // together and labelled with whichever the money() default was. The
  // payout form offers EUR, USD and AED, so the totals were arithmetic on
  // unlike things. /global/money was fixed for this; this page and the
  // sales page were not.
  const byCurrency = (
    rows: { currency?: string | null }[],
    amount: (row: never) => number
  ) => {
    const totals = new Map<string, number>();
    for (const row of rows) {
      const ccy = (row.currency ?? "EUR").toUpperCase();
      totals.set(ccy, (totals.get(ccy) ?? 0) + amount(row as never));
    }
    return totals;
  };

  const earnedBy = byCurrency(sales ?? [], (s: { educator_cents: number | null }) =>
    s.educator_cents ?? 0
  );
  const paidOutBy = byCurrency(
    (payouts ?? []).filter((p) => p.status === "paid"),
    (p: { net_cents: number }) => p.net_cents
  );

  const waitingBy = new Map<string, number>();
  for (const [ccy, cents] of earnedBy) {
    waitingBy.set(ccy, Math.max(0, cents - (paidOutBy.get(ccy) ?? 0)));
  }

  // One line per currency, biggest first, or a dash when there is nothing
  // rather than a confident zero in a currency nobody has used.
  const lines = (totals: Map<string, number>) =>
    totals.size === 0
      ? "Nothing yet"
      : [...totals.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([ccy, cents]) => money(cents, ccy))
          .join(", ");

  return (
    <WorkspaceShell kind="edu" nav="/educator/payouts">
        <section className="sec">
          <Crumbs trail={[["Sales", "/educator/sales"], ["Payouts"]]} />
          <h1>Payouts</h1>
          <p className="lead">
            You keep {share?.value ?? 70} percent of what a course sells for.
            The rest covers the payment fees and the platform.
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <h3>Paid out</h3>
              {(payouts ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Nothing paid out yet.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(payouts ?? []).map((payout) => (
                    <div className="li linkrow" key={payout.id}>
                      <div>
                        <b>{money(payout.net_cents, payout.currency)}</b>
                        <div className="muted small">
                          {payout.period_start} to {payout.period_end}
                          {payout.reference ? `. ${payout.reference}` : ""}
                        </div>
                      </div>
                      <div className="rowmeta">
                        <span className={`chip ${payout.status === "paid" ? "chip-mint" : ""}`}>
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Where you stand</h3>
                <dl className="kv">
                  <dt>Earned in total</dt>
                  <dd>{lines(earnedBy)}</dd>
                  <dt>Paid out</dt>
                  <dd>{lines(paidOutBy)}</dd>
                  <dt>Waiting</dt>
                  <dd>{lines(waitingBy)}</dd>
                </dl>
              </div>

              <div className="panel panel-wash">
                <h3>How it is paid</h3>
                <p className="muted small" style={{ marginTop: 8 }}>
                  By bank transfer, monthly, arranged by the Global team. A
                  refunded sale comes off before the next payout, so the
                  figure here is what is genuinely yours.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}