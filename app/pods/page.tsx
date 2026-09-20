import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Pods, ExpatPreneurs Global" };

export default async function PodsPage() {
  const member = await requireMember("/pods");
  const supabase = await createClient();

  const [{ data: pods }, { data: sizes }, { data: mine }, { data: villages }] =
    await Promise.all([
      supabase
        .from("pods")
        .select("id, slug, name, purpose, cadence, status, village_id")
        .neq("status", "closed")
        .order("name"),
      supabase.from("pod_sizes").select("pod_id, members, places_left"),
      supabase.from("pod_members").select("pod_id").eq("profile_id", member.id),
      supabase.from("villages").select("id, name"),
    ]);

  const joined = new Set((mine ?? []).map((p) => p.pod_id));
  const sizeOf = (id: string) =>
    sizes?.find((s) => s.pod_id === id) ?? { members: 0, places_left: 0 };
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "Every Village";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Pods</h1>
          <p className="lead">
            Small and committed. A handful of members who meet on a rhythm and
            hold each other to what they said they would do.
          </p>
          <p>
            <Link className="btn primary" href="/pods/propose">
              Propose a Pod
            </Link>
          </p>
        </section>

        <section className="band">
          {(pods ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                None forming yet. If there is one you would want, propose it:
                whoever proposes a Pod leads it.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(pods ?? []).map((pod) => {
                const size = sizeOf(pod.id);
                return (
                  <Link className="panel" key={pod.id} href={`/pods/${pod.slug}`}>
                    <span className="chip">{villageName(pod.village_id)}</span>
                    <h3 style={{ marginTop: 10 }}>{pod.name}</h3>
                    <p className="muted small">{pod.purpose}</p>
                    <p className="muted small" style={{ marginBottom: 0 }}>
                      Meets {pod.cadence}. {size.members} members,{" "}
                      {size.places_left} places left
                      {joined.has(pod.id) ? ". You are in this one." : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}