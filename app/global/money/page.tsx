import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/member";

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

  const ids = [
    ...new Set((payments ?? []).map((p) => p.profile_id).filter(Boolean)),
  ] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const total = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <main className="wrap">
      <section className="band">
        <h1>Money</h1>
        <p className="lead">
          Memberships and event tickets. Rows appear here once Stripe is
          connected.
        </p>
      </section>

      <section className="band">
        <div className="grid three">
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

      <section className="band">
        <h2>Recent payments</h2>
        {(payments ?? []).length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing yet. Membership is free for now and tickets are not
              charged until Stripe is live.
            </p>
          </div>
        ) : (
          <div className="rows">
            {(payments ?? []).map((payment) => (
              <div className="rowlink" key={payment.id}>
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
                    className={`chip ${payment.status === "paid" ? "mint" : ""}`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}