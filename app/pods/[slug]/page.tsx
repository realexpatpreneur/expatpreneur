import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { JoinPodButton } from "../../groups/forms";

export default async function PodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/pods");
  const supabase = await createClient();

  const { data: pod } = await supabase
    .from("pods")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!pod) notFound();

  const [{ data: members }, { data: size }, { data: lead }] = await Promise.all([
    supabase.from("pod_members").select("profile_id").eq("pod_id", pod.id),
    supabase
      .from("pod_sizes")
      .select("members, places_left")
      .eq("pod_id", pod.id)
      .maybeSingle(),
    pod.lead_id
      ? supabase
          .from("profiles")
          .select("id, full_name, headline")
          .eq("id", pod.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ids = (members ?? []).map((m) => m.profile_id);
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", ids)
    : { data: [] };

  const joined = ids.includes(member.id);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/pods">Pods</Link>
          </p>
          <p>
            <span className="chip">Meets {pod.cadence}</span>{" "}
            <span className={`chip ${pod.status === "open" ? "mint" : ""}`}>
              {pod.status}
            </span>
          </p>
          <h1>{pod.name}</h1>
          <p className="lead">{pod.purpose}</p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>
                {size?.members ?? 0} of {pod.capacity}
              </h3>
              {(people ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Nobody yet.
                </p>
              ) : joined ? (
                <div className="rows" style={{ marginTop: 12 }}>
                  {(people ?? []).map((person) => (
                    <Link
                      className="rowlink"
                      key={person.id}
                      href={`/members/${person.id}`}
                    >
                      <div>
                        <b>{person.full_name}</b>
                        <div className="muted small">{person.headline}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Who is in a Pod is shown to the people in it. Join and you
                  will see them.
                </p>
              )}
            </div>

            <div className="stack">
              <div className="panel">
                <JoinPodButton
                  podId={pod.id}
                  slug={pod.slug}
                  joined={joined}
                  full={(size?.places_left ?? 0) <= 0}
                />
                {joined && pod.whatsapp_url ? (
                  <p style={{ marginTop: 12 }}>
                    <a
                      className="btn mint"
                      href={pod.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the WhatsApp group
                    </a>
                  </p>
                ) : null}
              </div>

              {lead ? (
                <div className="panel">
                  <h3>Led by</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/members/${lead.id}`}>{lead.full_name}</Link>
                    {lead.headline ? `, ${lead.headline}` : ""}
                  </p>
                </div>
              ) : null}

              <div className="panel wash">
                <h3>What joining means</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Turning up {pod.cadence}, saying what you are working on, and
                  being asked about it next time. A Pod with people who drift is
                  worse than no Pod.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}