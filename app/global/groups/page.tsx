import { createClient } from "@/lib/supabase/server";
import { GroupForm, PodForm } from "./forms";

export const metadata = { title: "Groups and Pods, Global" };

export default async function GlobalGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const supabase = await createClient();

  const [{ data: groups }, { data: pods }, { data: people }, { data: villages }] =
    await Promise.all([
      // whatsapp_url lives behind group_rooms and pod_rooms now. The
      // Global team is admitted to both, so the forms still pre-fill.
      supabase
        .from("industry_groups")
        .select("id, slug, name, industry, description, lead_id, status, cover_url, created_at, updated_at")
        .order("name"),
      supabase
        .from("pods")
        .select("id, slug, name, purpose, village_id, lead_id, capacity, cadence, status, created_at, updated_at")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name")
        .limit(300),
      supabase.from("villages").select("id, name").order("name"),
    ]);

  // The links themselves, which only the two views serve.
  const [{ data: groupRooms }, { data: podRooms }] = await Promise.all([
    supabase.from("group_rooms").select("id, whatsapp_url"),
    supabase.from("pod_rooms").select("id, whatsapp_url"),
  ]);

  const groupLink = new Map(
    (groupRooms ?? []).map((r) => [r.id, r.whatsapp_url as string | null])
  );
  const podLink = new Map(
    (podRooms ?? []).map((r) => [r.id, r.whatsapp_url as string | null])
  );

  const groupsWithLinks = (groups ?? []).map((g) => ({
    ...g,
    whatsapp_url: groupLink.get(g.id) ?? null,
  }));
  const podsWithLinks = (pods ?? []).map((p) => ({
    ...p,
    whatsapp_url: podLink.get(p.id) ?? null,
  }));

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Groups and Pods</h1>
        <p className="lead">
          Industry Groups gather a trade across every Village. Pods are small
          and meet on a rhythm.
        </p>
        {done ? <div className="flag ok">Saved.</div> : null}
      </section>

      <section className="sec">
        <h2>Industry Groups</h2>
        <div className="gside">
          <div className="stack">
            {groupsWithLinks.length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  None yet.
                </p>
              </div>
            ) : (
              groupsWithLinks.map((group) => (
                <GroupForm key={group.id} people={people ?? []} group={group} />
              ))
            )}
          </div>
          <GroupForm people={people ?? []} />
        </div>
      </section>

      <section className="sec">
        <h2>Pods</h2>
        <div className="gside">
          <div className="stack">
            {podsWithLinks.length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  None yet.
                </p>
              </div>
            ) : (
              podsWithLinks.map((pod) => (
                <PodForm
                  key={pod.id}
                  people={people ?? []}
                  villages={villages ?? []}
                  pod={pod}
                />
              ))
            )}
          </div>
          <PodForm people={people ?? []} villages={villages ?? []} />
        </div>
      </section>
    </main>
  );
}