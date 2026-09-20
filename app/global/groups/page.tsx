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
      supabase.from("industry_groups").select("*").order("name"),
      supabase.from("pods").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name")
        .limit(300),
      supabase.from("villages").select("id, name").order("name"),
    ]);

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
            {(groups ?? []).length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  None yet.
                </p>
              </div>
            ) : (
              (groups ?? []).map((group) => (
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
            {(pods ?? []).length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  None yet.
                </p>
              </div>
            ) : (
              (pods ?? []).map((pod) => (
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