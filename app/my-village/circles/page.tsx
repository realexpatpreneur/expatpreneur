import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead } from "@/components/village-space";
import { Av } from "@/components/bits";

export const metadata = { title: "Circles, ExpatPreneurs Global" };

const TONES = ["blue", "mint", "navy", "sun"];

export default async function VillageCirclesPage() {
  const member = await requireMember("/my-village/circles");
  const supabase = await createClient();

  const { data: circles } = member.village_id
    ? await supabase
        .from("circle_capacity")
        .select("circle_id, name, members, places_left, capacity")
        .eq("village_id", member.village_id)
    : { data: [] };

  const ids = (circles ?? []).map((c) => c.circle_id);
  const { data: rows } = ids.length
    ? await supabase.from("circles").select("id, status, host_id").in("id", ids)
    : { data: [] };
  const hostIds = (rows ?? []).map((r) => r.host_id).filter(Boolean) as string[];
  const { data: hosts } = hostIds.length
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", hostIds)
    : { data: [] };

  const rowOf = (id: string) => rows?.find((r) => r.id === id);
  const hostOf = (id: string | null | undefined) =>
    hosts?.find((h) => h.id === id);

  return (
    <WorkspaceShell kind="member">
      <VillageHead here="/my-village/circles" />

      <div className="g3" style={{ marginTop: 16 }}>
        {(circles ?? []).map((c, i) => {
          const row = rowOf(c.circle_id);
          const host = hostOf(row?.host_id);
          const mine = c.circle_id === member.circle_id;
          return (
            <Link
              className="circlecard linkrow has-cover"
              href="/my-circle"
              key={c.circle_id}
            >
              <span className={`ctile ct-${TONES[i % TONES.length]}`}>
                <b>{c.name}</b>
                <span>
                  {c.members ? `${c.members} members` : "Opening soon"}
                </span>
              </span>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                {mine ? (
                  <span className="chip chip-blue">Yours</span>
                ) : row?.status === "open" ? (
                  <span className="chip chip-mint">Welcoming</span>
                ) : (
                  <span className="chip">Preparing</span>
                )}
              </div>
              {host ? (
                <div className="li" style={{ padding: 0 }}>
                  <Av name={host.full_name} className="av-sm" />
                  <div className="grow">
                    <b>{host.full_name}</b>
                    <span className="muted small">Circle Host</span>
                  </div>
                </div>
              ) : null}
              <p className="muted small">
                {c.members} of {c.capacity ?? 50} members
              </p>
            </Link>
          );
        })}
      </div>

      <p className="muted small" style={{ marginTop: 12 }}>
        You belong to the whole Village. Village events and Ask &amp; Offer are
        open to every Circle.
      </p>
    </WorkspaceShell>
  );
}