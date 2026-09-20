import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { AmountsForm, RunButton, PaidForm } from "./forms";

export const metadata = { title: "Team recognition, the Global team" };

const roleLabel: Record<string, string> = {
  local_admin: "Local Admin",
  circle_host: "Circle Host",
  industry_lead: "Industry Lead",
  pod_lead: "Pod Lead",
};

export default async function RecognitionPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: settings }, { data: due }, { data: payouts }] =
    await Promise.all([
      supabase.from("settings").select("key, value"),
      supabase.from("recognition_due").select("profile_id, role, currency"),
      supabase
        .from("payouts")
        .select("id, person_id, role, period_start, net_cents, currency, status, reference")
        .eq("kind", "recognition")
        .order("period_start", { ascending: false })
        .limit(60),
    ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

  const ids = [
    ...new Set([
      ...(due ?? []).map((d) => d.profile_id),
      ...(payouts ?? []).map((p) => p.person_id),
    ]),
  ];

  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name, village_id").in("id", ids)
    : { data: [] };

  const { data: villages } = await supabase.from("villages").select("id, name");

  const nameOf = (id: string) =>
    people?.find((p) => p.id === id)?.full_name ?? "A member";
  const villageOf = (id: string) => {
    const village = villages?.find(
      (v) => v.id === people?.find((p) => p.id === id)?.village_id
    );
    return village?.name ?? "";
  };

  const amountFor = (role: string) => {
    const key =
      role === "local_admin"
        ? "recognition_local_admin"
        : role === "circle_host"
          ? "recognition_circle_host"
          : "recognition_lead";
    return Number(values[key] ?? 0);
  };

  const money = (cents: number, currency: string) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });

  const thisMonth = new Date().toISOString().slice(0, 8) + "01";
  const alreadyRun = (payouts ?? []).some((p) => p.period_start === thisMonth);
  const owed = (payouts ?? []).filter((p) => p.status === "due");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Team recognition</h1>
          <p className="lead">
            A monthly thank you for the people building the community. It uses
            the same payout system as educators.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <RunButton />
          </div>
          {alreadyRun ? (
            <p className="muted small" style={{ marginTop: 8 }}>
              This month has already been run. Running it again adds nobody
              twice.
            </p>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>Who would be recognised</h3>
                {(due ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody holds one of these roles yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(due ?? []).map((person) => (
                      <div className="rowlink" key={person.profile_id}>
                        <div>
                          <b>{nameOf(person.profile_id)}</b>
                          <div className="muted small">
                            {roleLabel[person.role] ?? person.role}
                            {villageOf(person.profile_id)
                              ? `, ${villageOf(person.profile_id)}`
                              : ""}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span className="chip">
                            {amountFor(person.role) === 0
                              ? "To be decided"
                              : `${amountFor(person.role)} ${
                                  values.recognition_currency ?? "EUR"
                                }`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Recorded</h3>
                {(payouts ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing recorded yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(payouts ?? []).map((payout) => (
                      <div className="rowlink" key={payout.id}>
                        <div>
                          <b>{nameOf(payout.person_id)}</b>
                          <div className="muted small">
                            {roleLabel[payout.role ?? ""] ?? payout.role}.{" "}
                            {payout.period_start}.{" "}
                            {money(payout.net_cents, payout.currency)}
                            {payout.reference ? `. ${payout.reference}` : ""}
                          </div>
                        </div>
                        <div className="rowmeta">
                          {payout.status === "paid" ? (
                            <span className="chip mint">paid</span>
                          ) : (
                            <PaidForm id={payout.id} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <AmountsForm values={values} />

              <div className="panel wash">
                <h3>What is owed</h3>
                <dl className="kv">
                  <dt>Waiting to be paid</dt>
                  <dd>{owed.length}</dd>
                  <dt>Paid from</dt>
                  <dd>
                    {values.recognition_paid_from ?? "Membership and ticket income"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}