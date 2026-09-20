import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";

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
      .eq("person_id", member.id)
      .eq("status", "paid"),
    supabase.from("settings").select("value").eq("key", "educator_share").maybeSingle(),
  ]);

  const money = (cents: number, currency = "EUR") =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });

  const paidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.net_cents, 0);

  const earned = (sales ?? []).reduce((sum, s) => sum + (s.educator_cents ?? 0), 0);
  const waiting = earned - paidOut;

  return (
    <WorkspaceShell kind="edu" nav="/educator/payouts">
        <section className="band">
          <p className="muted small">
            <Link href="/educator/sales">Sales</Link>
          </p>
          <h1>Payouts</h1>
          <p className="lead">
            You keep {share?.value ?? 70} percent of what a course sells for.
            The rest covers the payment fees and the platform.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>Paid out</h3>
              {(payouts ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing paid out yet.
                </p>
              ) : (
                <div className="rows" style={{ marginTop: 12 }}>
                  {(payouts ?? []).map((payout) => (
                    <div className="rowlink" key={payout.id}>
                      <div>
                        <b>{money(payout.net_cents, payout.currency)}</b>
                        <div className="muted small">
                          {payout.period_start} to {payout.period_end}
                          {payout.reference ? `. ${payout.reference}` : ""}
                        </div>
                      </div>
                      <div className="rowmeta">
                        <span className={`chip ${payout.status === "paid" ? "mint" : ""}`}>
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
                  <dd>{money(earned)}</dd>
                  <dt>Paid out</dt>
                  <dd>{money(paidOut)}</dd>
                  <dt>Waiting</dt>
                  <dd>{money(Math.max(0, waiting))}</dd>
                </dl>
              </div>

              <div className="panel wash">
                <h3>How it is paid</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
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