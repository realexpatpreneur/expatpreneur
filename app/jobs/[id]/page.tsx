import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { CloseJobForm } from "../../businesses/forms";

const kindLabel: Record<string, string> = {
  job: "Hiring",
  freelance: "Freelance",
  partner: "Partner",
};

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember("/jobs");
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();

  const [{ data: poster }, { data: business }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, village_id")
      .eq("id", job.poster_id)
      .maybeSingle(),
    job.business_id
      ? supabase
          .from("businesses")
          .select("name, slug")
          .eq("id", job.business_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const mine = job.poster_id === member.id;
  const sameVillage = poster?.village_id === member.village_id;
  const canReach = mine || sameVillage || isPaid(member);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/jobs">Jobs and freelance</Link>
          </p>
          <p>
            <span className="chip blue">{kindLabel[job.kind] ?? job.kind}</span>{" "}
            {job.remote ? <span className="chip">Remote possible</span> : null}{" "}
            {job.status !== "open" ? (
              <span className="chip sun">{job.status}</span>
            ) : null}
          </p>
          <h1>{job.title}</h1>
          <p className="lead">
            {business?.name ? `${business.name}. ` : ""}
            {job.location ?? "Location not given"}. {timeAgo(job.created_at)}.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{job.description}</p>
              </div>
              {job.compensation ? (
                <div className="panel">
                  <h3>Pay</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {job.compensation}
                  </p>
                </div>
              ) : null}
              {mine && job.status === "open" ? (
                <div className="panel wash">
                  <h3>When it is done</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Closing it keeps the board honest.
                  </p>
                  <CloseJobForm jobId={job.id} />
                </div>
              ) : null}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Getting in touch</h3>
                {job.apply_note ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {job.apply_note}
                  </p>
                ) : null}
                {mine ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    This is your post.
                  </p>
                ) : canReach && poster ? (
                  <Link className="btn primary" href={`/messages/${poster.id}`}>
                    Message {poster.full_name.split(" ")[0]}
                  </Link>
                ) : (
                  <>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      They are in another Village, so reaching them is part of
                      the paid plan.
                    </p>
                    <Link className="btn" href="/upgrade">
                      See the paid plan
                    </Link>
                  </>
                )}
              </div>

              {business ? (
                <div className="panel">
                  <h3>The business</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/businesses/${business.slug}`}>{business.name}</Link>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}