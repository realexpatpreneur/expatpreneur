import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PathwayForm, StepForm } from "../forms";

export default async function GlobalPathwayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { slug } = await params;
  const { done } = await searchParams;
  const supabase = await createClient();

  const { data: pathway } = await supabase
    .from("market_pathways")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!pathway) notFound();

  const [{ data: steps }, { data: followers }] = await Promise.all([
    supabase
      .from("pathway_steps")
      .select("*")
      .eq("pathway_id", pathway.id)
      .order("position"),
    supabase
      .from("pathway_followers")
      .select("profile_id, note, started_at")
      .eq("pathway_id", pathway.id),
  ]);

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/global/markets">Market pathways</Link>
        </p>
        <h1>{pathway.title}</h1>
        <p className="lead">
          {pathway.country}. {(steps ?? []).length} steps.{" "}
          {(followers ?? []).length} members following it.
        </p>
        {done ? <div className="notice good">Saved.</div> : null}
      </section>

      {(followers ?? []).some((f) => f.note) ? (
        <section className="band">
          <h2>What they are trying to do</h2>
          <div className="rows">
            {(followers ?? [])
              .filter((f) => f.note)
              .map((follower) => (
                <div className="rowlink" key={follower.profile_id}>
                  <div>
                    <b>{follower.note}</b>
                  </div>
                </div>
              ))}
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>
            This is the list that tells you which step is missing.
          </p>
        </section>
      ) : null}

      <section className="band">
        <div className="cols">
          <div className="stack">
            {(steps ?? []).map((step) => (
              <StepForm
                key={step.id}
                pathwayId={pathway.id}
                nextPosition={step.position}
                step={step}
              />
            ))}
            <StepForm
              pathwayId={pathway.id}
              nextPosition={(steps ?? []).length + 1}
            />
          </div>
          <PathwayForm pathway={pathway} />
        </div>
      </section>
    </main>
  );
}