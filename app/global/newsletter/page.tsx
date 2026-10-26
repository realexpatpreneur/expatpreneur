import { PageHead } from "@/components/workspace-shell";
import { Stat, Table } from "@/components/admin-bits";
import { Empty } from "@/components/empty";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { flodeskReady } from "@/lib/flodesk";
import { Download } from "./forms";

export const metadata = { title: "Newsletter, the Global team" };

// Who has asked for the newsletter, and who has since asked to stop.
// Until this page existed the table was write only: signups went in and
// nobody could see them, so a Flodesk outage or a refused address was
// invisible to everybody.
export default async function NewsletterPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("newsletter_signups")
    .select("id, email, source, created_at, unsubscribed_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const all = rows ?? [];
  const on = all.filter((r) => !r.unsubscribed_at);
  const off = all.filter((r) => r.unsubscribed_at);

  const month = new Date();
  month.setDate(month.getDate() - 30);
  const recent = on.filter((r) => new Date(r.created_at) >= month).length;

  const when = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <PageHead
        title="Newsletter"
        sub="Who has asked for it, and who has asked to stop."
        actions={on.length ? <Download rows={on} /> : undefined}
      />

      <div className="g3 g4">
        <Stat label="On the list" value={on.length} note="Wanting the newsletter" />
        <Stat label="Last 30 days" value={recent} note="New signups" />
        <Stat label="Unsubscribed" value={off.length} note="Asked to stop" />
        <Stat
          label="Flodesk"
          value={flodeskReady ? "On" : "Off"}
          note={flodeskReady ? "Signups are mirrored" : "No key set yet"}
        />
      </div>

      {flodeskReady ? null : (
        <div className="flag hold" style={{ marginTop: 16 }}>
          Flodesk is not connected, so nothing here has reached it. Signups
          are being kept, and they go across on the day the key is set.
          supabase/setup/flodesk-setup.md has the three settings.
        </div>
      )}

      <section className="sec" style={{ marginTop: 16 }}>
        <div className="panel">
          <h3>Everybody, newest first</h3>
          {all.length === 0 ? (
            <Empty line="Nobody has signed up yet. The form is on Watch and Listen and in the footer of every public page." tight />
          ) : (
            <Table head={["Address", "Came from", "Signed up", "Standing"]}>
              {all.map((row) => (
                <tr key={row.id}>
                  <td>{row.email}</td>
                  <td className="hide-m">{row.source ?? "Not recorded"}</td>
                  <td>{when(row.created_at)}</td>
                  <td>
                    {row.unsubscribed_at ? (
                      <span className="chip">
                        Stopped {when(row.unsubscribed_at)}
                      </span>
                    ) : (
                      <span className="chip chip-mint">On the list</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {all.length >= 500 ? (
            <p className="muted small" style={{ marginTop: 12 }}>
              The 500 most recent. Take a copy for the whole list.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
