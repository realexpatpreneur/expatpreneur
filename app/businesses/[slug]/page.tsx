import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactBusinessForm } from "../contact-form";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Open to anybody. A listing that is not public simply does not come
  // back for a stranger.
  const member = await whoIsHere();
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

  const mine = Boolean(member) && business.owner_id === member?.id;

  return (
    <>
      <SiteHeader signedIn={Boolean(member)} />
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
          <div className="facerow">
            {business.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="face big" src={business.logo_url} alt="" />
            ) : null}
            <h1 style={{ margin: 0 }}>{business.name}</h1>
          </div>
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
              {business.offer ? (
                <div className="panel wash">
                  <h3>Current offer</h3>
                  <p style={{ marginTop: 6 }}>{business.offer}</p>
                </div>
              ) : null}

              {(business.services ?? []).length ? (
                <div className="panel">
                  <h3>Services</h3>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(business.services ?? []).map((service: string) => (
                      <div className="rowlink" key={service}>
                        <div>
                          <b>{service}</b>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}


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

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>Contact {business.name}</h3>
              <ContactBusinessForm slug={business.slug} name={business.name} />
            </div>
            <div className="panel wash">
              <h3>How this works</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Your message goes to the member who runs this business, with
                your email address so they can reply. Nothing is paid or
                arranged through ExpatPreneurs.
              </p>
            </div>
          </div>
        </section>
      </main>
      {member ? null : <SiteFooter />}
    </>
  );
}