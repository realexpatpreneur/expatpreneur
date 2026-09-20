import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Reporting, Global" };

const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export default async function GlobalReportingPage() {
  const supabase = await createClient();

  const [
    { data: villages },
    { data: growth },
    { data: asks },
    { data: money },
    { data: renewals },
    { data: rooms },
  ] = await Promise.all([
    supabase.from("village_summary").select("*").order("members", { ascending: false }),
    supabase
      .from("village_growth")
      .select("village_id, month, joined")
      .order("month", { ascending: false })
      .limit(60),
    supabase.from("village_asks").select("village_id, posts, answered"),
    supabase
      .from("money_by_month")
      .select("month, kind, currency, payments, cents")
      .order("month", { ascending: false })
      .limit(12),
    supabase
      .from("renewal_summary")
      .select("cycle, village_id, asked, staying, leaving, waiting"),
    supabase.from("village_rooms").select("village_id, sessions, came"),
  ]);

  const totals = (villages ?? []).reduce(
    (sum, v) => ({
      members: sum.members + (v.members ?? 0),
      paid: sum.paid + (v.paid ?? 0),
      waiting: sum.waiting + (v.waiting ?? 0),
    }),
    { members: 0, paid: 0, waiting: 0 }
  );

  // Joins across the network, by month.
  const byMonth = new Map<string, number>();
  for (const row of growth ?? []) {
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.joined);
  }

  const answeredFor = (id: string) => {
    const row = asks?.find((a) => a.village_id === id);
    if (!row?.posts) return null;
    return Math.round((row.answered / row.posts) * 100);
  };

  const roomsFor = (id: string) =>
    rooms?.find((r) => r.village_id === id) ?? { sessions: 0, came: 0 };

  const cycles = [...new Set((renewals ?? []).map((r) => r.cycle))].sort().reverse();

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Reporting</h1>
        <p className="lead">
          Every Village side by side, how the network is growing, and what it
          takes in.
        </p>
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>Active members</h3>
            <p className="lead" style={{ margin: 0 }}>{totals.members}</p>
          </div>
          <div className="panel">
            <h3>On the paid plan</h3>
            <p className="lead" style={{ margin: 0 }}>{totals.paid}</p>
            <p className="muted small">
              {totals.members
                ? `${Math.round((totals.paid / totals.members) * 100)} percent`
                : ""}
            </p>
          </div>
          <div className="panel">
            <h3>Requests waiting</h3>
            <p className="lead" style={{ margin: 0 }}>{totals.waiting}</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>Villages</h2>
        <div className="divide">
          {(villages ?? []).map((village) => {
            const answered = answeredFor(village.village_id);
            const room = roomsFor(village.village_id);
            return (
              <div className="li linkrow" key={village.village_id}>
                <div>
                  <b>{village.name}</b>
                  <div className="muted small">
                    {village.members} members, {village.paid} paid,{" "}
                    {village.circles} Circles, {village.upcoming} coming up.{" "}
                    {answered !== null ? `${answered} percent of asks answered. ` : ""}
                    {room.sessions
                      ? `${room.sessions} live rooms, ${room.came} attended.`
                      : ""}
                  </div>
                </div>
                <div className="rowmeta">
                  {village.quiet ? (
                    <span className="chip chip-sun">{village.quiet} quiet</span>
                  ) : null}
                  <span className={`chip ${village.status === "open" ? "chip-mint" : ""}`}>
                    {village.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sec">
        <div className="gside">
          <div className="panel">
            <h3>People arriving, everywhere</h3>
            {byMonth.size === 0 ? (
              <p className="muted small" style={{ marginTop: 6 }}>
                Nothing yet.
              </p>
            ) : (
              <div className="divide" style={{ marginTop: 12 }}>
                {[...byMonth.entries()].slice(0, 12).map(([month, joined]) => (
                  <div className="li linkrow" key={month}>
                    <div>
                      <b>{monthName(month)}</b>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">{joined}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stack">
            <div className="panel">
              <h3>Money</h3>
              {(money ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing taken yet. Membership is free and tickets are not
                  charged until Stripe is live.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(money ?? []).map((row) => (
                    <div className="li linkrow" key={`${row.month}-${row.kind}-${row.currency}`}>
                      <div>
                        <b>
                          {(Number(row.cents) / 100).toFixed(2)} {row.currency}
                        </b>
                        <div className="muted small">
                          {monthName(row.month)}. {row.kind}. {row.payments}{" "}
                          {row.payments === 1 ? "payment" : "payments"}.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 12 }}>
                <Link className="btn btn-ghost" href="/global/money">
                  Every payment
                </Link>
              </p>
            </div>

            {cycles.length ? (
              <div className="panel">
                <h3>Who stayed</h3>
                {cycles.map((cycle) => {
                  const rows = (renewals ?? []).filter((r) => r.cycle === cycle);
                  const asked = rows.reduce((n, r) => n + r.asked, 0);
                  const staying = rows.reduce((n, r) => n + r.staying, 0);
                  const leaving = rows.reduce((n, r) => n + r.leaving, 0);
                  const share = asked ? Math.round((staying / asked) * 100) : 0;
                  return (
                    <div key={cycle} style={{ marginTop: 10 }}>
                      <b>{cycle}</b>
                      <p className="muted small" style={{ margin: "4px 0 0" }}>
                        {asked} asked, {staying} staying, {leaving} leaving.{" "}
                        {share} percent stayed.
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="panel panel-wash">
              <h3>Reading these</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                The share of asks answered is the one worth watching. A Village
                where posts go unanswered will lose people months before the
                membership numbers show it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}