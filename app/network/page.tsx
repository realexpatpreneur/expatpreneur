import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageCard, type VillageRow } from "@/components/cards";
import { Lock } from "@/components/lock";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { NotifyButton } from "./forms";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "The Global network, ExpatPreneurs Global" };

// The Global layer from a member's point of view: every Village, with what
// they can do in each.
export default async function NetworkPage() {
  const member = await requireMember("/network");
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }, { data: circleRows }, { data: interest }] =
    await Promise.all([
      supabase
        .from("villages")
        .select("id, slug, name, city, country, status, summary, cover_url")
        .order("name"),
      supabase
        .from("profiles")
        .select("village_id")
        .eq("status", "active"),
      supabase.from("circles").select("village_id"),
      supabase
        .from("village_interest")
        .select("village_id")
        .eq("profile_id", member.id),
    ]);

  const membersIn = (id: string) =>
    (counts ?? []).filter((c) => c.village_id === id).length;

  const circlesIn = (id: string) =>
    (circleRows ?? []).filter((c) => c.village_id === id).length;

  // The card reads these two off the row, so they are counted here and
  // handed over. The prototype's network card shows a nationality count
  // beside the members; 0015 took that column away from members, so it
  // is not shown rather than guessed at.
  const card = (v: { id?: string; [k: string]: unknown }) =>
    ({
      ...v,
      members: v.id ? membersIn(v.id as string) : 0,
      circles: v.id ? circlesIn(v.id as string) : 0,
    }) as VillageRow;

  const asked = (id: string) =>
    (interest ?? []).some((i) => i.village_id === id);

  const open = (villages ?? []).filter((v) => v.status === "open");
  const soon = (villages ?? []).filter((v) =>
    ["launching", "exploring"].includes(v.status)
  );

  const paid = isPaid(member);

  return (
    <WorkspaceShell kind="member" nav="/network">
        <section className="sec">
          <Crumbs trail={[["Home", "/home"], ["The Global network"]]} />
          <h1>The Global network</h1>
          <p className="lead">
            {open.length} {open.length === 1 ? "Village is" : "Villages are"}{" "}
            open
            {soon.length
              ? `, and ${soon.length} more ${soon.length === 1 ? "is" : "are"} on the way.`
              : "."}
          </p>

          {paid ? null : (
            <Lock style={{ marginTop: 14 }}>
              You can browse every Village. Contacting members and attending
              events in other Villages is a paid benefit.
            </Lock>
          )}
        </section>

        <section className="sec">
          <div className="g3">
            {open.map((village) => {
              const mine = village.id === member.village_id;
              return (
                <VillageCard
                  key={village.id}
                  village={card(village)}
                  chipLabel={mine ? "Your Village" : undefined}
                  actions={
                    mine ? (
                      <Link className="btn btn-ghost btn-sm" href="/my-village">
                        Open
                      </Link>
                    ) : paid ? (
                      <>
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/directory?village=${village.slug}`}
                        >
                          Members
                        </Link>
                        <Link className="btn btn-ghost btn-sm" href="/events">
                          Events
                        </Link>
                      </>
                    ) : (
                      <Link
                        className="btn btn-ghost btn-sm"
                        href={`/villages/${village.slug}`}
                      >
                        Look around
                      </Link>
                    )
                  }
                />
              );
            })}
          </div>
        </section>

        {soon.length ? (
          <section className="sec">
            <h2>On the way</h2>
            <div className="g3" style={{ marginTop: 16 }}>
              {soon.map((village) => (
                <VillageCard
                  key={village.id}
                  village={card(village)}
                  actions={
                    <NotifyButton
                      villageId={village.id}
                      already={asked(village.id)}
                    />
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="panel panel-wash">
            <h3>Moving city?</h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Your profile and your history come with you. Ask to transfer to
              the Village in your new city.
            </p>
            <Link className="btn btn-ghost" href="/settings/transfer">
              Request a transfer
            </Link>
          </div>
        </section>
      </WorkspaceShell>
  );
}