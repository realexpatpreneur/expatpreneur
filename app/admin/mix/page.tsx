import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Village mix, the Local Admin workspace" };

// Internal only. This page and its rule are never mentioned on a public
// page, in the member space, or in anything written to an applicant.
export default async function VillageMixPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageIds = admin.villageIds.length
    ? admin.villageIds
    : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: mix }, { data: circles }, { data: villages }, { data: settings }] =
    await Promise.all([
      supabase
        .from("village_nationality_mix")
        .select("village_id, village, nationality, members, people, percent")
        .in("village_id", villageIds)
        .order("percent", { ascending: false }),
      supabase
        .from("circle_mix")
        .select("circle_id, circle_name, nationality, members, people, percent, village_id")
        .in("village_id", villageIds)
        .order("percent", { ascending: false }),
      supabase.from("villages").select("id, name").in("id", villageIds),
      supabase.from("settings").select("key, value"),
    ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const limit = Number(values.nationality_limit ?? 30);
  const fromSize = Number(values.nationality_from_size ?? 30);
  const balanceCircles = (values.balance_circles ?? "on") !== "off";

  // The largest nationality in each Circle, which is what the rule is
  // about at Circle level.
  type CircleRow = {
    circle_id: string;
    circle_name: string;
    nationality: string;
    members: number;
    people: number;
    percent: number;
  };

  const largestInCircle = new Map<string, CircleRow>();
  for (const row of (circles ?? []) as CircleRow[]) {
    if (!largestInCircle.has(row.circle_id)) largestInCircle.set(row.circle_id, row);
  }

  const headcount = (mix ?? [])[0]?.people ?? 0;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin">Overview</Link>
          </p>
          <h1>Village mix</h1>
          <p className="lead">
            Internal only. Never mention this rule publicly or in writing to
            members.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3>Members by nationality</h3>
                  <span className="muted small">
                    {headcount} members,{" "}
                    {new Set((mix ?? []).map((m) => m.nationality)).size}{" "}
                    nationalities
                  </span>
                </div>

                {(mix ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Nobody has given a nationality yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(mix ?? []).map((row) => (
                      <div className="rowlink" key={`${row.village_id}-${row.nationality}`}>
                        <div>
                          <b>{row.nationality}</b>
                          <div className="muted small">
                            {row.members} of {row.people} members
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${
                              Number(row.percent) >= limit
                                ? "sun"
                                : Number(row.percent) >= limit - 3
                                  ? "sun"
                                  : ""
                            }`}
                          >
                            {row.percent} percent
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="muted small" style={{ marginTop: 12 }}>
                  When a nationality reaches {limit} percent, new requests from
                  that nationality wait until the balance allows. The Village
                  itself is never capped.
                </p>
              </div>

              <div className="panel">
                <h3>Inside each Circle</h3>
                {!balanceCircles ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Circle balancing is switched off, so only the Village
                    figure is watched.
                  </p>
                ) : largestInCircle.size === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody is placed in a Circle yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {[...largestInCircle.values()].map((row) => (
                      <div className="rowlink" key={row.circle_id}>
                        <div>
                          <b>{row.circle_name}</b>
                          <div className="muted small">
                            {row.nationality}, {row.members} of {row.people}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${Number(row.percent) > limit ? "sun" : ""}`}
                          >
                            {row.percent} percent
                          </span>
                          {Number(row.percent) > limit ? (
                            <Link className="btn" href="/admin/members">
                              Rebalance
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <h3>The rule</h3>
                <dl className="kv">
                  <dt>Nationality limit</dt>
                  <dd>{limit} percent of a Village</dd>
                  <dt>Applies from</dt>
                  <dd>{fromSize} members</dd>
                  <dt>Circles balanced too</dt>
                  <dd>{balanceCircles ? "Yes" : "No"}</dd>
                </dl>
                <p className="muted small">
                  The same for every Village, and set by the Global team.
                  Village size is never capped.
                </p>
              </div>

              <div className="panel wash">
                <h3>Why it exists</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  A Village where most people share one passport stops being
                  useful to anybody in it. The rule protects that, which is
                  also why it is never explained to applicants: a decision
                  about balance reads as a decision about them.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}