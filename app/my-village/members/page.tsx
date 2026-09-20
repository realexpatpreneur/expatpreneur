import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead } from "@/components/village-space";
import { Av } from "@/components/bits";

export const metadata = { title: "Members, ExpatPreneurs Global" };

export default async function VillageMembersPage() {
  const member = await requireMember("/my-village/members");
  const supabase = await createClient();

  const { data: people } = member.village_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, industry, business_name, circle_id")
        .eq("village_id", member.village_id)
        .eq("status", "active")
        .order("full_name")
        .limit(60)
    : { data: [] };

  return (
    <WorkspaceShell kind="member">
      <VillageHead here="/my-village/members" />

      <div className="g3" style={{ marginTop: 16 }}>
        {(people ?? [])
          .filter((p) => p.id !== member.id)
          .map((p) => (
            <article className="mcard" key={p.id}>
              <Link className="row linkrow" href={`/members/${p.id}`}>
                <Av name={p.full_name} />
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontWeight: 650, display: "block" }}>
                    {p.full_name}
                  </b>
                  <span className="where">
                    {member.villageName}
                    {p.circle_id === member.circle_id ? ", your Circle" : ""}
                  </span>
                </div>
              </Link>
              <p className="small">{p.headline ?? p.business_name}</p>
              <div className="tags">
                {p.industry ? <span className="chip">{p.industry}</span> : null}
              </div>
              <div className="row" style={{ marginTop: "auto" }}>
                <Link className="btn btn-ghost btn-sm" href={`/messages/${p.id}`}>
                  Message
                </Link>
              </div>
            </article>
          ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link className="btn btn-ghost" href="/directory">
          Search the full Directory
        </Link>
      </div>
    </WorkspaceShell>
  );
}