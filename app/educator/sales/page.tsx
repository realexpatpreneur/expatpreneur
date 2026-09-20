import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { MessageLearnersForm } from "./forms";

export const metadata = { title: "Sales, your courses" };

export default async function SalesPage() {
  const member = await requireMember("/educator/sales");
  const supabase = await createClient();

  // The view carries what each sale earned, worked out from the share at
  // the time rather than from anything stored twice.
  const [{ data: sales }, { data: courses }, { data: refunds }] = await Promise.all([
    supabase
      .from("course_sales")
      .select("purchase_id, course_id, course_title, amount_cents, educator_cents, currency, status, guest_name, buyer_id, created_at, month")
      .eq("educator_id", member.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("courses")
      .select("id, title")
      .eq("educator_id", member.id)
      .eq("status", "published"),
    supabase
      .from("refund_requests")
      .select("id, purchase_id, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const paid = (sales ?? []).filter((s) => s.status === "paid");
  const refunded = (sales ?? []).filter((s) => s.status === "refunded");

  const money = (cents: number, currency = "EUR") =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });

  const earned = paid.reduce((sum, s) => sum + (s.educator_cents ?? 0), 0);
  const thisMonth = paid.filter(
    (s) => s.month === new Date().toISOString().slice(0, 8) + "01"
  );

  const buyerCount = (courseId: string) =>
    paid.filter((s) => s.course_id === courseId).length;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/educator">Your courses</Link>
          </p>
          <h1>Sales</h1>
          <p className="lead">
            {paid.length} sold, {money(earned)} earned.{" "}
            {refunded.length ? `${refunded.length} refunded.` : ""}
          </p>
          <p>
            <Link className="btn" href="/educator/payouts">
              What you are owed
            </Link>
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>Every sale</h3>
                {paid.length === 0 && refunded.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing sold yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(sales ?? []).map((sale) => (
                      <div className="rowlink" key={sale.purchase_id}>
                        <div>
                          <b>{sale.course_title}</b>
                          <div className="muted small">
                            {sale.buyer_id ? "A member" : sale.guest_name ?? "Someone outside"}
                            . {timeAgo(sale.created_at)}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span className={`chip ${sale.status === "paid" ? "mint" : ""}`}>
                            {sale.status === "refunded"
                              ? "refunded"
                              : money(sale.educator_cents ?? 0, sale.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(refunds ?? []).length ? (
                <div className="panel">
                  <h3>Refunds asked for</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    The Global team decides these, since the money went
                    through the platform. You see them so nothing happens
                    behind your back.
                  </p>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(refunds ?? []).map((request) => (
                      <div className="rowlink" key={request.id}>
                        <div>
                          <b>{request.reason}</b>
                          <div className="muted small">
                            {timeAgo(request.created_at)}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span className="chip">{request.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>This month</h3>
                <dl className="kv">
                  <dt>Sold</dt>
                  <dd>{thisMonth.length}</dd>
                  <dt>Earned</dt>
                  <dd>
                    {money(
                      thisMonth.reduce((sum, s) => sum + (s.educator_cents ?? 0), 0)
                    )}
                  </dd>
                </dl>
              </div>

              {(courses ?? []).length ? (
                <MessageLearnersForm
                  courses={(courses ?? []).map((c) => ({
                    id: c.id,
                    title: c.title,
                    buyers: buyerCount(c.id),
                  }))}
                />
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}