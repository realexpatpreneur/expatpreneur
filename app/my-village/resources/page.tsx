import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead } from "@/components/village-space";
import { Ic } from "@/components/icon";

export const metadata = { title: "Resources, ExpatPreneurs Global" };

const TILES = ["lt-blue", "lt-mint", "lt-sun", "lt-pink"];

export default async function VillageResourcesPage() {
  const member = await requireMember("/my-village/resources");
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("resources")
    .select("id, title, description, kind, url")
    .order("title")
    .limit(24);

  return (
    <WorkspaceShell kind="member">
      <VillageHead here="/my-village/resources" />

      <div className="panel panel-wash" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <b>Guides, templates and workshop recordings</b>
            <p className="muted small">Everything in one library.</p>
          </div>
          <Link className="btn btn-primary btn-sm" href="/library">
            Open the library
          </Link>
        </div>
      </div>

      <div className="g2" style={{ marginTop: 16 }}>
        {(items ?? []).map((item, i) => (
          <Link className="panel linkrow libcard" href={item.url ?? "/library"} key={item.id}>
            <span className={`lib-tile ${TILES[i % TILES.length]}`}>
              <Ic name={item.kind === "template" ? "download" : "book"} />
            </span>
            <div>
              <b>{item.title}</b>
              <p className="muted small">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}