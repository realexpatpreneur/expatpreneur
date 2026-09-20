import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/businesses");
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  const [{ data: owner }, { data: village }, { data: jobs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, village_id")
      .eq("id", business.owner_id)
      .maybeSingle(),
    business.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", business.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("jobs")
      .select("id, title, kind, status")
      .eq("business_id", business.id)
      .eq("status", "open"),
  ]);

  const mine = business.owner_id === member.id;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/businesses">Businesses</Link>
          </p>
          <p>
            {business.industry ? (
              <span className="chip">{business.industry}</span>
            ) : null}{" "}
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {business.public ? <span className="chip mint">Public</span> : null}
          </p>
          <h1>{business.name}</h1>
          <p className="lead">{business.tagline}</p>
          <p>
            {business.website ? (
              <a
                className="btn"
                href={business.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit the website
              </a>
            ) : null}{" "}
            {mine ? (
              <Link className="btn" href="/businesses/new">
                Edit
              </Link>
            ) : owner ? (
              <Link className="btn primary" href={`/members/${owner.id}`}>
                See {owner.full_name.split(" ")[0]}
              </Link>
            ) : null}
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>What it does</h3>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                {business.description || "Nothing written yet."}
              </p>
              <dl className="kv">
                <dt>Started</dt>
                <dd>{business.founded || "Not given"}</dd>
                <dt>Sells into</dt>
                <dd>{(business.serves ?? []).join(", ") || "Not given"}</dd>
              </dl>
            </div>

            <div className="stack">
              {owner ? (
                <div className="panel">
                  <h3>Run by</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/members/${owner.id}`}>{owner.full_name}</Link>
                    {owner.headline ? `, ${owner.headline}` : ""}
                  </p>
                </div>
              ) : null}

              {(jobs ?? []).length ? (
                <div className="panel">
                  <h3>Looking for people</h3>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(jobs ?? []).map((job) => (
                      <Link className="rowlink" key={job.id} href={`/jobs/${job.id}`}>
                        <div>
                          <b>{job.title}</b>
                          <div className="muted small">{job.kind}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}