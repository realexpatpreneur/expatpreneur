import { PageHead } from "@/components/workspace-shell";
import { Table, Flag } from "@/components/admin-bits";
import { createClient } from "@/lib/supabase/server";
import { VillageForm } from "../forms";

export default async function GlobalVillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const supabase = await createClient();

  const { data: villages } = await supabase
    .from("villages")
    .select("*")
    .order("name");

  return (
    <>
      <PageHead
        title="Villages"
        sub="A Village opens where there are enough members, a shared language and someone to run it."
      />
      {done ? <Flag ok>Saved.</Flag> : null}

      <div className="gside" style={{ marginTop: 16 }}>
        <div className="stack">
          <Table head={["Village", "Status", "Where", "Circles"]}>
            {(villages ?? []).map((v) => (
              <tr key={v.id}>
                <td>
                  <b>{v.name}</b>
                  <div className="muted small">{v.summary}</div>
                </td>
                <td>
                  <span
                    className={`chip ${
                      v.status === "open"
                        ? "chip-mint"
                        : v.status === "launching" || v.status === "exploring"
                          ? "chip-sun"
                          : ""
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="hide-m">
                  {v.city}
                  {v.country ? `, ${v.country}` : ""}
                </td>
                <td>{v.timezone ?? ""}</td>
              </tr>
            ))}
          </Table>

          {(villages ?? []).map((village) => (
            <div className="panel" key={village.id}>
              <h3 style={{ fontSize: 14 }}>{village.name}</h3>
              <VillageForm village={village} />
            </div>
          ))}
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>New Village</h3>
            <VillageForm />
          </div>
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>Before a Village opens</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Two Local Admins, a first Circle Host, a WhatsApp announcement
              group and a Village page. Pausing a Village stops new
              applications and events; members keep their profile either way.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}