import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PathwayForm } from "./forms";

export const metadata = { title: "Market pathways, Global" };

export default async function GlobalMarketsPage() {
  const supabase = await createClient();

  const [{ data: pathways }, { data: questions }] = await Promise.all([
    supabase.from("market_pathways").select("*").order("country"),
    supabase
      .from("market_posts")
      .select("country")
      .eq("status", "open"),
  ]);

  // Where the demand is, straight from what members are asking.
  const demand = new Map<string, number>();
  for (const question of questions ?? []) {
    demand.set(question.country, (demand.get(question.country) ?? 0) + 1);
  }

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Market pathways</h1>
        <p className="lead">
          Written from what members keep asking. The questions come first, the
          route comes after.
        </p>
      </section>

      <section className="sec">
        <h2>What members are asking about</h2>
        {demand.size === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              No open market questions yet.
            </p>
          </div>
        ) : (
          <div className="divide">
            {[...demand.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div className="li linkrow" key={country}>
                  <div>
                    <b>{country}</b>
                    <div className="muted small">
                      {(pathways ?? []).some((p) => p.country === country)
                        ? "A pathway exists."
                        : "No pathway yet."}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span className="chip chip-blue">{count} asking</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="sec">
        <div className="gside">
          <div className="stack">
            {(pathways ?? []).length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  None yet.
                </p>
              </div>
            ) : (
              (pathways ?? []).map((pathway) => (
                <div className="panel" key={pathway.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h3>{pathway.title}</h3>
                    <span
                      className={`chip ${pathway.status === "published" ? "chip-mint" : ""}`}
                    >
                      {pathway.status}
                    </span>
                  </div>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {pathway.country}
                    {pathway.city ? `, ${pathway.city}` : ""}.{" "}
                    {pathway.tier === "paid" ? "Paid members only." : "Every member."}
                  </p>
                  <div className="row">
                    <Link className="btn btn-ghost" href={`/global/markets/${pathway.slug}`}>
                      Steps
                    </Link>
                    <Link className="btn btn-ghost" href={`/markets/${pathway.slug}`}>
                      See it as a member
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          <PathwayForm />
        </div>
      </section>
    </main>
  );
}