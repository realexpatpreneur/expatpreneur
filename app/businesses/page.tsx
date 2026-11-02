import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { Arrow, Faces, GoArrow, PHOTO, tintFor, initialsOf } from "@/components/design/parts";

export const metadata = { title: "Businesses, ExpatPreneurs Global" };

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; category?: string; done?: string }>;
}) {
  const { q = "", show = "all", category = "", done } = await searchParams;
  // The marketplace is open to anybody. What comes back is decided by the
  // database: a stranger sees the listings whose owners allow it.
  const member = await whoIsHere();
  const supabase = await createClient();

  let query = supabase
    .from("businesses")
    .select("id, slug, name, tagline, industry, serves, owner_id, village_id, category, offer, logo_url")
    .order("name")
    .limit(150);

  if (show === "mine" && member) query = query.eq("owner_id", member.id);
  if (show === "village" && member?.village_id) {
    query = query.eq("village_id", member.village_id);
  }
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,tagline.ilike.%${q}%,industry.ilike.%${q}%`
    );
  }

  const [{ data: businesses }, { data: villages }, { data: allCategories }] =
    await Promise.all([
      query,
      supabase.from("villages").select("id, name"),
      supabase.from("businesses").select("category").not("category", "is", null),
    ]);

  const categories = [
    ...new Set(
      (allCategories ?? [])
        .map((c) => c.category as string)
        .filter(Boolean)
    ),
  ].sort();

  const rows = (businesses ?? []).filter((b) =>
    category ? b.category === category : true
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    const lead = rows[0];
    const later = rows.slice(1);

    const where = (business: (typeof rows)[number]) => (
      <>
        {villageName(business.village_id)}
        {(business.serves ?? []).length
          ? `. Sells into ${(business.serves ?? []).join(", ")}`
          : ""}
      </>
    );

    return (
      <PublicPage active="/businesses">
        <PageBlocks data={{ businesses: businesses ?? [] }} slug="businesses">
        <div className="d-page">
          <section style={{ padding: "64px 0 48px" }}>
            <div className="d-wrap">
              <h1 className="d-h1" style={{ maxWidth: "14ch" }}>Businesses</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                What members actually do, and which markets they already sell into.
              </p>
              {done ? (
                <p className="d-status d-open" style={{ marginTop: 18 }}>Saved.</p>
              ) : null}
              {member ? (
                <p style={{ marginTop: 28 }}>
                  <Link className="d-btn d-btn-dark d-shine" href="/businesses/new">
                    Add your business
                  </Link>
                </p>
              ) : null}
              <form className="d-search" style={{ marginTop: 32 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7683" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
                <input name="q" defaultValue={q} placeholder="Name, industry or what they do" />
                <button className="d-btn d-btn-sm d-btn-dark d-shine" type="submit">
                  Search
                </button>
              </form>
            </div>
          </section>

          <div className="d-wrap">
            <nav className="d-tabs">
              {(member
                ? ([
                    ["all", "Everywhere"],
                    ["village", "My Village"],
                    ["mine", "Mine"],
                  ] as [string, string][])
                : ([["all", "All"]] as [string, string][])
              ).map(([key, label]) => (
                <Link
                  key={key}
                  className={show === key ? "on" : ""}
                  href={`/businesses?show=${key}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {categories.length ? (
            <div className="d-wrap" style={{ marginTop: 20 }}>
              <nav className="d-tabs">
                <Link className={category ? "" : "on"} href={`/businesses?show=${show}`}>
                  Every category
                </Link>
                {categories.map((name) => (
                  <Link
                    key={name}
                    className={category === name ? "on" : ""}
                    href={`/businesses?show=${show}&category=${encodeURIComponent(name)}`}
                  >
                    {name}
                  </Link>
                ))}
              </nav>
            </div>
          ) : null}

          <section style={{ padding: "56px 0 104px" }}>
            <div className="d-wrap">
              {rows.length === 0 ? (
                <div className="d-rows">
                  <div className="d-row">
                    <p className="d-body">Nothing here yet. Yours could be the first.</p>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    className="d-card-paper d-lift"
                    href={`/businesses/${lead.slug}`}
                    style={{ display: "grid", gridTemplateColumns: "88px minmax(0,1fr)", gap: 28, alignItems: "center", padding: 36 }}
                  >
                    {lead.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img className="d-av" src={lead.logo_url} alt="" style={{ width: 88, height: 88 }} />
                    ) : (
                      <span className="d-ini" style={{ width: 88, height: 88, fontSize: 26, background: tintFor(lead.name) }}>
                        {initialsOf(lead.name)}
                      </span>
                    )}
                    <span>
                      {lead.industry ? (
                        <span className="d-lbl" style={{ color: "#6B7683" }}>{lead.industry}</span>
                      ) : null}
                      <b style={{ display: "block", marginTop: 8, fontSize: 30, fontWeight: 800, letterSpacing: "-.03em" }}>
                        {lead.name}
                      </b>
                      <span className="d-body" style={{ display: "block", marginTop: 8, fontSize: 17 }}>{lead.tagline}</span>
                      <span className="d-small" style={{ display: "block", marginTop: 10 }}>{where(lead)}</span>
                    </span>
                  </Link>

                  {later.length ? (
                    <div className="d-biz" style={{ marginTop: 56 }}>
                      {later.map((business) => (
                        <Link className="d-brow" key={business.id} href={`/businesses/${business.slug}`}>
                          {business.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img className="d-av" src={business.logo_url} alt="" style={{ width: 52, height: 52 }} />
                          ) : (
                            <span className="d-ini" style={{ width: 52, height: 52, fontSize: 15, background: tintFor(business.name) }}>
                              {initialsOf(business.name)}
                            </span>
                          )}
                          <span>
                            {business.industry ? (
                              <span className="d-lbl" style={{ color: "#6B7683" }}>{business.industry}</span>
                            ) : null}
                            <b style={{ display: "block", marginTop: 4, fontSize: 17 }}>{business.name}</b>
                            <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{business.tagline}</span>
                            <span className="d-small" style={{ display: "block", marginTop: 4, fontSize: 13 }}>{where(business)}</span>
                          </span>
                          <GoArrow />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="d-sec d-sec-top0">
            <div className="d-wrap">
              <div className="d-dark" style={{ borderRadius: 6, padding: 52, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                  <span style={{ display: "block", marginBottom: 22 }}>
                    <Faces srcs={[PHOTO.tomas, PHOTO.julien, PHOTO.nadia]} size={48} />
                  </span>
                  <h2 className="d-h2">Run a business abroad?</h2>
                  <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.6, color: "#B9C3CD" }}>
                    Members can list their business here once they are in.
                  </p>
                </div>
                <Link className="d-btn d-btn-mint d-shine" href="/apply">
                  Request your invitation <Arrow />
                </Link>
              </div>
            </div>
          </section>
        </div>
        </PageBlocks>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/businesses" active="/businesses">
      <PageBlocks data={{ businesses: businesses ?? [] }} slug="businesses">
        <section className={member ? "sec" : "pubsec hero-center"}>
          <h1>Businesses</h1>
          <p className="lead">
            What members actually do, and which markets they already sell into.
          </p>
          {done ? <div className="flag ok">Saved.</div> : null}
          {member ? (
            <p>
              <Link className="btn btn-primary" href="/businesses/new">
                Add your business
              </Link>
            </p>
          ) : null}
          <form className="searchrow">
            <input name="q" defaultValue={q} placeholder="Name, industry or what they do" />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>
          <div className="filters">
            {(member
              ? ([
                  ["all", "Everywhere"],
                  ["village", "My Village"],
                  ["mine", "Mine"],
                ] as [string, string][])
              : ([["all", "All"]] as [string, string][])
            ).map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/businesses?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {categories.length ? (
            <div className="filters">
              <Link
                className={`fchip ${category ? "" : "on"}`}
                href={`/businesses?show=${show}`}
              >
                Every category
              </Link>
              {categories.map((name) => (
                <Link
                  key={name}
                  className={`fchip ${category === name ? "on" : ""}`}
                  href={`/businesses?show=${show}&category=${encodeURIComponent(name)}`}
                >
                  {name}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="sec">
          {rows.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing here yet. Yours could be the first.
              </p>
            </div>
          ) : (
            <div className="g3">
              {rows.map((business) => (
                <Link
                  className="panel"
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                >
                  {business.industry ? (
                    <span className="chip">{business.industry}</span>
                  ) : null}
                  <h3 style={{ marginTop: 12 }}>{business.name}</h3>
                  <p className="muted small">{business.tagline}</p>
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    {villageName(business.village_id)}
                    {(business.serves ?? []).length
                      ? `. Sells into ${(business.serves ?? []).join(", ")}`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {member ? null : (
          <section className="pubsec" style={{ paddingTop: 0 }}>
            <div className="band">
              <div style={{ flex: 1, minWidth: 240 }}>
                <h2 style={{ fontSize: 18 }}>Run a business abroad?</h2>
                <p style={{ marginTop: 4 }}>
                  Members can list their business here once they are in.
                </p>
              </div>
              <Link className="btn btn-mint" href="/apply">
                Request your invitation
              </Link>
            </div>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}