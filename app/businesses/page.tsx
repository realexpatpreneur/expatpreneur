import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Businesses, ExpatPreneurs Global" };

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; done?: string }>;
}) {
  const { q = "", show = "all", done } = await searchParams;
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

  const [{ data: businesses }, { data: villages }] = await Promise.all([
    query,
    supabase.from("villages").select("id, name"),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <>
      <SiteHeader signedIn={Boolean(member)} />
      <main className="wrap">
        <section className={member ? "band" : "hero center"}>
          <h1>Businesses</h1>
          <p className="lead">
            What members actually do, and which markets they already sell into.
          </p>
          {done ? <div className="notice good">Saved.</div> : null}
          <p>
            <Link className="btn primary" href="/businesses/new">
              Add your business
            </Link>
          </p>
          <form className="searchrow">
            <input name="q" defaultValue={q} placeholder="Name, industry or what they do" />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
          <div className="tabs">
            {[
              ["all", "Everywhere"],
              ["village", "My Village"],
              ["mine", "Mine"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/businesses?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          {(businesses ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing here yet. Yours could be the first.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(businesses ?? []).map((business) => (
                <Link
                  className="panel"
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                >
                  {business.industry ? (
                    <span className="chip">{business.industry}</span>
                  ) : null}
                  <h3 style={{ marginTop: 10 }}>{business.name}</h3>
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
          <section className="band cta">
            <h2>Run a business abroad?</h2>
            <p className="lead">
              Members can list their business here once they are in.
            </p>
            <p>
              <Link className="btn primary" href="/apply">
                Request your invitation
              </Link>
            </p>
          </section>
        )}
      </main>
      {member ? null : <SiteFooter />}
    </>
  );
}