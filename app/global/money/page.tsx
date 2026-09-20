import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";
import { RefundDecision, PayoutForm } from "../plans/money-forms";

export default async function GlobalMoneyPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: subscriptions }, { count: paidMembers }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id, kind, amount_cents, currency, status, created_at, profile_id, guest_email")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("subscriptions")
        .select("id, status, current_period_end, profile_id")
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "paid"),
    ]);

  // The course side of the money: what sold, who wants a refund, and what
  // each educator is owed.
  const [{ data: sales }, { data: refundAsks }, { data: payouts }] =
    await Promise.all([
      supabase
        .from("course_sales")
        .select("purchase_id, course_title, educator_id, amount_cents, educator_cents, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("refund_requests")
        .select("id, purchase_id, profile_id, reason, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false }),
      supabase.from("payouts").select("person_id, net_cents, status, kind"),
    ]);

  const owedBy = new Map<string, { owed: number; currency: string }>();
  for (const sale of sales ?? []) {
    if (sale.status !== "paid" || !sale.educator_id) continue;
    const row = owedBy.get(sale.educator_id) ?? { owed: 0, currency: sale.currency };
    row.owed += sale.educator_cents ?? 0;
    owedBy.set(sale.educator_id, row);
  }
  for (const payout of payouts ?? []) {
    if (payout.status !== "paid") continue;
    const row = owedBy.get(payout.person_id);
    if (row) row.owed -= payout.net_cents;
  }

  const ids = [
    ...new Set([
      ...(payments ?? []).map((p) => p.profile_id).filter(Boolean),
      ...(sales ?? []).map((s) => s.educator_id).filter(Boolean),
      ...(refundAsks ?? []).map((r) => r.profile_id).filter(Boolean),
    ]),
  ] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const total = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Money</h1>
        <p className="lead">
          Memberships and event tickets. Rows appear here once Stripe is
          connected.
        </p>
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>Paid members</h3>
            <p className="lead" style={{ margin: 0 }}>{paidMembers ?? 0}</p>
          </div>
          <div className="panel">
            <h3>Active subscriptions</h3>
            <p className="lead" style={{ margin: 0 }}>
              {(subscriptions ?? []).length}
            </p>
          </div>
          <div className="panel">
            <h3>Taken so far</h3>
            <p className="lead" style={{ margin: 0 }}>
              {(total / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>Recent payments</h2>
        {(payments ?? []).length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet. Membership is free for now and tickets are not
              charged until Stripe is live.
            </p>
          </div>
        ) : (
          <div className="divide">
            {(payments ?? []).map((payment) => (
              <div className="li linkrow" key={payment.id}>
                <div>
                  <b>
                    {(payment.amount_cents / 100).toFixed(2)} {payment.currency}
                  </b>
                  <div className="muted small">
                    {payment.kind}.{" "}
                    {people?.find((p) => p.id === payment.profile_id)?.full_name ??
                      payment.guest_email ??
                      "A guest"}
                    . {timeAgo(payment.created_at)}.
                  </div>
                </div>
                <div className="rowmeta">
                  <span
                    className={`chip ${payment.status === "paid" ? "chip-mint" : ""}`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sec">
        <h2>Courses</h2>
        <div className="gside">
          <div className="stack">
            <div className="panel">
              <h3>Refunds asked for</h3>
              {(refundAsks ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing waiting.
                </p>
              ) : (
                <div className="stack" style={{ marginTop: 12 }}>
                  {(refundAsks ?? []).map((request) => (
                    <div className="panel panel-wash" key={request.id}>
                      <p className="muted small">
                        {people?.find((p) => p.id === request.profile_id)
                          ?.full_name ?? "A member"}
                        . {timeAgo(request.created_at)}
                      </p>
                      <p style={{ marginTop: 8 }}>{request.reason}</p>
                      <RefundDecision id={request.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <h3>Course sales</h3>
              {(sales ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing sold yet.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(sales ?? []).slice(0, 25).map((sale) => (
                    <div className="li linkrow" key={sale.purchase_id}>
                      <div>
                        <b>{sale.course_title}</b>
                        <div className="muted small">
                          {people?.find((p) => p.id === sale.educator_id)
                            ?.full_name ?? "An educator"}
                          . {timeAgo(sale.created_at)}
                        </div>
                      </div>
                      <div className="rowmeta">
                        <span className={`chip ${sale.status === "paid" ? "chip-mint" : ""}`}>
                          {(sale.amount_cents / 100).toFixed(0)} {sale.currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            {owedBy.size ? (
              <PayoutForm
                educators={[...owedBy.entries()].map(([id, row]) => ({
                  id,
                  name: people?.find((p) => p.id === id)?.full_name ?? "An educator",
                  owed: row.owed,
                  currency: row.currency,
                }))}
              />
            ) : (
              <div className="panel panel-wash">
                <h3>Payouts</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing to pay out until a course sells.
                </p>
              </div>
            )}

            <div className="panel panel-wash">
              <h3>The share</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Educators keep a percentage of each sale, recorded on every
                payout, so changing it later does not change what was already
                agreed.
              </p>
              <Link className="btn btn-ghost" href="/global/plans">
                Plans and prices
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}