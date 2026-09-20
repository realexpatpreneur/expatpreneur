import { PageHead } from "@/components/workspace-shell";
import { MixRow, SecHead, Table } from "@/components/admin-bits";
import { Ic } from "@/components/icon";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

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
      <PageHead
        title="Village mix"
        sub="Internal only. Never mention this rule publicly or in writing to members."
      />

      <div className="gside">
        <div className="stack">
          <div className="panel">
            <SecHead title="Members by nationality" />
            <span className="muted small">
              {headcount} members,{" "}
              {new Set((mix ?? []).map((m) => m.nationality)).size} nationalities
            </span>

            {(mix ?? []).length === 0 ? (
              <p className="muted small" style={{ marginTop: 8 }}>
                Nobody has given a nationality yet.
              </p>
            ) : (
              <div className="divide" style={{ marginTop: 10 }}>
                {(mix ?? []).map((row) => (
                  <MixRow
                    key={`${row.village_id}-${row.nationality}`}
                    name={row.nationality}
                    count={row.members}
                    percent={Number(row.percent)}
                    limit={limit}
                  />
                ))}
              </div>
            )}

            <p className="muted small" style={{ marginTop: 12 }}>
              The dark marker shows the {limit} percent limit. When a
              nationality reaches it, new requests from that nationality wait
              until the balance allows. The Village itself is never capped.
            </p>
          </div>

          <div className="panel">
            <SecHead title="Inside each Circle" />
            {!balanceCircles ? (
              <p className="muted small">
                Circle balancing is switched off, so only the Village figure is
                watched.
              </p>
            ) : largestInCircle.size === 0 ? (
              <p className="muted small">Nobody is placed in a Circle yet.</p>
            ) : (
              <Table head={["Circle", "Largest nationality", "Share"]}>
                {[...largestInCircle.values()].map((row) => (
                  <tr key={row.circle_id}>
                    <td>
                      <b>{row.circle_name}</b>
                    </td>
                    <td>
                      {row.nationality}, {row.members} of {row.people}
                    </td>
                    <td
                      style={
                        Number(row.percent) > limit
                          ? { color: "#B8691F", fontWeight: 600 }
                          : undefined
                      }
                    >
                      {row.percent} percent
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>The rule</h3>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Nationality limit</label>
              <div
                className="input"
                style={{ justifyContent: "space-between", background: "var(--wash)" }}
              >
                <span>{limit}% of a Village</span>
                <Ic name="lock" style={{ width: 16, height: 16 }} />
              </div>
              <div className="hint">
                The same for every Village. Village size is never capped.
              </div>
            </div>
          </div>

          <div className="panel panel-wash">
            <p className="small muted">
              Keep this rule internal. It never appears on the website, in
              emails or in member documents.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}