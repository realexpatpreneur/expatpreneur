import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead } from "@/components/village-space";
import { MemberCard } from "@/components/member-card";

export const metadata = { title: "Members, ExpatPreneurs Global" };

export default async function VillageMembersPage() {
  const member = await requireMember("/my-village/members");
  const supabase = await createClient();

  const { data: people } = member.village_id
    ? await supabase
        .from("profiles")
        .select(
          "id, full_name, headline, industry, business_name, circle_id, village_id, avatar_url, founding"
        )
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
            <MemberCard
              key={p.id}
              person={p}
              where={`${member.villageName ?? ""}${
                p.circle_id === member.circle_id ? ", your Circle" : ""
              }`}
              viewer={{
                id: member.id,
                village_id: member.village_id,
                paid: isPaid(member),
              }}
            />
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