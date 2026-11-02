import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { ContactBusinessForm } from "../contact-form";
import { Arrow } from "@/components/design/parts";

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

  // A visitor is granted only some columns of a business (0028), and
  // asking for one they are not granted fails the whole query, which is
  // what turned every listing into a 404 for anybody signed out. These
  // are the columns this page uses, all of them on that list.
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, owner_id, village_id, name, tagline, description, industry, website, founded, serves, public, services, offer, logo_url"
    )
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

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    const label = {
      fontSize: 13,
      fontWeight: 700,
      border: "1px solid #C7CDD4",
      borderRadius: 4,
      padding: "6px 10px",
    };
    const detail = {
      display: "grid",
      gridTemplateColumns: "minmax(0,180px) minmax(0,1fr)",
      gap: 20,
      padding: "16px 0",
      borderBottom: "1px solid #E3E6EA",
    };

    return (
      <PublicPage active="/businesses">
        <div className="d-page">
          <section style={{ padding: "48px 0 72px" }}>
            <div className="d-wrap">
              <p className="d-small">
                <Link href="/businesses">Businesses</Link>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 24 }}>
                {business.industry ? <span style={label}>{business.industry}</span> : null}
                {village?.name ? <span style={label}>{village.name}</span> : null}
                {business.public ? <span className="d-status d-open" style={{ fontSize: 13 }}>Public</span> : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
                {business.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className="d-av" src={business.logo_url} alt="" style={{ width: 84, height: 84 }} />
                ) : null}
                <h1 className="d-h1">{business.name}</h1>
              </div>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch" }}>{business.tagline}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                {business.website ? (
                  <a className="d-btn d-btn-line d-shine" href={business.website} target="_blank" rel="noreferrer">
                    Visit the website
                  </a>
                ) : null}
                {mine ? (
                  <Link className="d-btn d-btn-line d-shine" href="/businesses/new">
                    Edit
                  </Link>
                ) : owner ? (
                  <Link className="d-btn d-btn-dark d-shine" href={`/members/${owner.id}`}>
                    See {owner.full_name.split(" ")[0]} <Arrow />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="d-sec d-sec-top0">
            <div className="d-wrap d-apply">
              <div>
                <h2 className="d-h2">What it does</h2>
                <p className="d-lead" style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
                  {business.description || "Nothing written yet."}
                </p>
                <dl style={{ marginTop: 40, borderTop: "2px solid #0F1419" }}>
                  <div style={detail}>
                    <dt className="d-small">Started</dt>
                    <dd className="d-body" style={{ margin: 0 }}>{business.founded || "Not given"}</dd>
                  </div>
                  <div style={detail}>
                    <dt className="d-small">Sells into</dt>
                    <dd className="d-body" style={{ margin: 0 }}>
                      {(business.serves ?? []).join(", ") || "Not given"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                {business.offer ? (
                  <div className="d-dark" style={{ borderRadius: 6, padding: 28 }}>
                    <h2 className="d-h2" style={{ fontSize: 22 }}>Current offer</h2>
                    <p className="d-body" style={{ marginTop: 10 }}>{business.offer}</p>
                  </div>
                ) : null}

                {(business.services ?? []).length ? (
                  <div style={{ marginTop: business.offer ? 36 : 0 }}>
                    <h2 className="d-h2" style={{ fontSize: 22 }}>Services</h2>
                    <div className="d-rows" style={{ marginTop: 16 }}>
                      {(business.services ?? []).map((service: string) => (
                        <div className="d-row" key={service}>
                          <b style={{ fontSize: 16 }}>{service}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {owner ? (
                  <div style={{ marginTop: 36 }}>
                    <h2 className="d-h2" style={{ fontSize: 22 }}>Run by</h2>
                    <p className="d-body" style={{ marginTop: 12 }}>
                      <Link className="d-ulink" href={`/members/${owner.id}`}>{owner.full_name}</Link>
                      {owner.headline ? `, ${owner.headline}` : ""}
                    </p>
                  </div>
                ) : null}

                {(jobs ?? []).length ? (
                  <div style={{ marginTop: 36 }}>
                    <h2 className="d-h2" style={{ fontSize: 22 }}>Looking for people</h2>
                    <div className="d-rows" style={{ marginTop: 16 }}>
                      {(jobs ?? []).map((job) => (
                        <Link className="d-row" key={job.id} href={`/jobs/${job.id}`} style={{ display: "block" }}>
                          <b style={{ display: "block", fontSize: 16 }}>{job.title}</b>
                          <span className="d-small" style={{ display: "block", marginTop: 4, fontSize: 13 }}>{job.kind}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="d-sec d-sec-top0">
            <div className="d-wrap d-apply">
              <div className="d-boxed d-form">
                <h2 className="d-h2">Contact {business.name}</h2>
                <ContactBusinessForm slug={business.slug} name={business.name} />
              </div>
              <div>
                <h2 className="d-h2" style={{ fontSize: 22 }}>How this works</h2>
                <p className="d-body" style={{ marginTop: 12 }}>
                  Your message goes to the member who runs this business, with
                  your email address so they can reply. Nothing is paid or
                  arranged through ExpatPreneurs.
                </p>
              </div>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/businesses" active="/businesses">
        <section className="sec">
          <p className="muted small">
            <Link href="/businesses">Businesses</Link>
          </p>
          <p>
            {business.industry ? (
              <span className="chip">{business.industry}</span>
            ) : null}{" "}
            {village?.name ? <span className="chip">{village.name}</span> : null}{" "}
            {business.public ? <span className="chip chip-mint">Public</span> : null}
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
                className="btn btn-ghost"
                href={business.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit the website
              </a>
            ) : null}{" "}
            {mine ? (
              <Link className="btn btn-ghost" href="/businesses/new">
                Edit
              </Link>
            ) : owner ? (
              <Link className="btn btn-primary" href={`/members/${owner.id}`}>
                See {owner.full_name.split(" ")[0]}
              </Link>
            ) : null}
          </p>
        </section>

        <section className="sec">
          <div className="gside">
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
                <div className="panel panel-wash">
                  <h3>Current offer</h3>
                  <p style={{ marginTop: 8 }}>{business.offer}</p>
                </div>
              ) : null}

              {(business.services ?? []).length ? (
                <div className="panel">
                  <h3>Services</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(business.services ?? []).map((service: string) => (
                      <div className="li linkrow" key={service}>
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
                  <p className="muted small" style={{ marginTop: 8 }}>
                    <Link href={`/members/${owner.id}`}>{owner.full_name}</Link>
                    {owner.headline ? `, ${owner.headline}` : ""}
                  </p>
                </div>
              ) : null}

              {(jobs ?? []).length ? (
                <div className="panel">
                  <h3>Looking for people</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(jobs ?? []).map((job) => (
                      <Link className="li linkrow" key={job.id} href={`/jobs/${job.id}`}>
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

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <h3>Contact {business.name}</h3>
              <ContactBusinessForm slug={business.slug} name={business.name} />
            </div>
            <div className="panel panel-wash">
              <h3>How this works</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                Your message goes to the member who runs this business, with
                your email address so they can reply. Nothing is paid or
                arranged through ExpatPreneurs.
              </p>
            </div>
          </div>
        </section>
      </DualPage>
  );
}