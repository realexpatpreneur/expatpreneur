import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Ic } from "@/components/icon";
import { TEXT_PAGES } from "@/lib/text-keys";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";

export const metadata = { title: "Wording, ExpatPreneurs Global" };

// Every public page, and how much of its wording has been changed.
export default async function WordingPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: rows } = await supabase.from("page_text").select("page, key");
  const changed = new Map<string, number>();
  for (const r of rows ?? [])
    changed.set(r.page, (changed.get(r.page) ?? 0) + 1);

  return (
    <>
      <PageHead
        title="Wording"
        sub="Every heading, introduction and panel on the public pages. Anything you do not change keeps the wording it has now."
      />

      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Address</th>
              <th>Lines you can edit</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {TEXT_PAGES.map((p) => (
              <tr key={p.page}>
                <td>
                  <Link href={`/global/wording/${p.page}`}>
                    <b>{p.name}</b>
                  </Link>
                </td>
                <td className="muted">{p.path}</td>
                <td>{p.keys.length}</td>
                <td>
                  {changed.get(p.page) ? (
                    <span className="chip chip-mint">
                      {changed.get(p.page)} edited
                    </span>
                  ) : (
                    <span className="muted small">As written in the build</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel panel-wash" style={{ marginTop: 16 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <Ic name="info" />
          <p className="muted small" style={{ margin: 0 }}>
            This changes wording, not layout. Whole pages made of prose,
            such as How it works, Membership and the legal pages, are
            edited under Pages instead.
          </p>
        </div>
      </div>
    </>
  );
}