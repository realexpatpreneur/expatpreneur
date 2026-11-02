import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import { MemberCard } from "@/components/member-card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SubscribeForm } from "@/app/media/subscribe-form";
import { PublicPage } from "@/components/public-page";
import { Arrow, Faces, PHOTO, tintFor, initialsOf } from "@/components/design/parts";

export const metadata = {
  title: "Members, ExpatPreneurs Global",
  description:
    "Members who chose to be listed publicly, across every Village.",
};

export default async function PublicMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ village?: string; q?: string }>;
}) {
  const { village = "", q = "" } = await searchParams;
  const supabase = await createClient();
  const me = await whoIsHere();

  const [
    { data: villages },
    { data: everyone },
    { data: villageCounts },
    { data: nationalities },
    { data: industries },
  ] = await Promise.all([
    supabase.from("villages").select("id, slug, name").order("name"),
    supabase
      .from("profiles")
      .select(
        "id, full_name, headline, business_name, industry, lived_in, village_id, avatar_url"
      )
      .eq("public_profile", true)
      .eq("status", "active")
      .order("full_name")
      .limit(200),
    // Counts over every member, not only the ones listed publicly, which
    // is what makes this a preview of the community rather than of the
    // shop window. The views return numbers, never people.
    supabase.from("public_village_members").select("slug, name, members"),
    supabase
      .from("public_nationalities")
      .select("nationality, members")
      .order("members", { ascending: false })
      .limit(8),
    supabase
      .from("public_industries")
      .select("industry, members")
      .order("members", { ascending: false })
      .limit(8),
  ]);

  const totalMembers = (villageCounts ?? []).reduce(
    (sum: number, v: { members: number }) => sum + (v.members ?? 0),
    0
  );
  const livedVillages = (villageCounts ?? []).filter(
    (v: { members: number }) => v.members > 0
  ).length;

  const villageId = villages?.find((v) => v.slug === village)?.id ?? null;

  const people = (everyone ?? []).filter((person) => {
    if (villageId && person.village_id !== villageId) return false;
    if (!q) return true;
    const hay = [
      person.full_name,
      person.headline,
      person.business_name,
      person.industry,
      ...(person.lived_in ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  // A visitor meets a few, not the lot. The Directory is the member's.
  const featured = me ? people : people.slice(0, 6);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const whereOf = (id: string | null) =>
    villageName(id) ? `${villageName(id)} Village` : "";

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!me) {
    return (
      <PublicPage active="/members">
        <PageBlocks data={{ people: people ?? [] }} slug="members">
        <div className="d-page">
          <section style={{ padding: "64px 0 72px" }}>
            <div className="d-wrap d-hero d-hero-search">
              <div>
                <h1 className="d-h1">Members</h1>
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "40ch" }}>
                  People building a business away from home, in every Village.
                </p>
              </div>
              <div className="d-mosaic">
                {/* eslint-disable @next/next/no-img-element */}
                <img src={PHOTO.tomas} alt="" style={{ marginTop: 48 }} />
                <img src={PHOTO.ines} alt="" />
                <img src={PHOTO.julien} alt="" style={{ marginTop: 28 }} />
                <img src={PHOTO.nadia} alt="" style={{ marginTop: -20 }} />
                <img src={PHOTO.kristiane} alt="" style={{ marginTop: -48, objectPosition: "center 20%" }} />
                <img src={PHOTO.table} alt="" style={{ marginTop: -28 }} />
                {/* eslint-enable @next/next/no-img-element */}
              </div>
            </div>
          </section>

          <section className="d-sec d-washed" style={{ padding: "72px 0" }}>
            <div className="d-wrap d-where">
              <div className="d-wcol">
                <h3 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.05 }}>
                  {totalMembers} {totalMembers === 1 ? "member" : "members"}
                </h3>
                <p className="d-small" style={{ marginTop: 10, fontSize: 15 }}>
                  {livedVillages === 1
                    ? "in one Village"
                    : `across ${livedVillages} Villages`}
                </p>
              </div>
              <div className="d-wcol">
                <h3 style={{ fontSize: 19, fontWeight: 700 }}>Where they are from</h3>
                <p className="d-body" style={{ marginTop: 10 }}>
                  {(nationalities ?? []).length
                    ? (nationalities ?? [])
                        .map((n: { nationality: string }) => n.nationality)
                        .join(" · ")
                    : "Told once there are enough members to say without naming anybody."}
                </p>
              </div>
              <div className="d-wcol">
                <h3 style={{ fontSize: 19, fontWeight: 700 }}>What they do</h3>
                <p className="d-body" style={{ marginTop: 10 }}>
                  {(industries ?? []).length
                    ? (industries ?? [])
                        .map((i: { industry: string }) => i.industry)
                        .join(" · ")
                    : "Every trade you would expect in a city, and some you would not."}
                </p>
              </div>
            </div>
          </section>

          <section style={{ padding: "72px 0 0" }}>
            <div className="d-wrap">
              <p className="d-body" style={{ maxWidth: "58ch" }}>
                A few members who chose to be listed publicly are below. The rest of the Directory is for members.
              </p>

              <form className="d-search" action="/members" style={{ marginTop: 28 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7683" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
                {village ? <input type="hidden" name="village" value={village} /> : null}
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="An industry, a market, a name"
                  aria-label="Search members"
                />
                <button className="d-btn d-btn-sm d-btn-dark d-shine" type="submit">
                  Search
                </button>
              </form>

              <div className="d-tabs" style={{ marginTop: 32 }}>
                <Link
                  className={village ? "" : "on"}
                  href={`/members${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                >
                  Everywhere
                </Link>
                {(villages ?? []).map((v) => (
                  <Link
                    className={village === v.slug ? "on" : ""}
                    href={`/members?village=${v.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    key={v.id}
                  >
                    {v.name}
                  </Link>
                ))}
              </div>

              {featured.length === 0 ? (
                <div className="d-rows" style={{ marginTop: 48 }}>
                  <div className="d-row">
                    <p className="d-body">
                      Nobody matches that yet. Most members keep their profile inside
                      the platform, which is their choice to make.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="d-people" style={{ marginTop: 48, alignItems: "start" }}>
                  {featured.map((person, i) => (
                    <Link
                      className="d-person"
                      key={person.id}
                      href={`/members/${person.id}`}
                      style={{ marginTop: i % 2 ? 40 : 0 }}
                    >
                      <span
                        className="d-ph d-shine"
                        style={person.avatar_url ? undefined : { background: tintFor(person.full_name) }}
                      >
                        {person.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={person.avatar_url} alt="" />
                        ) : (
                          <span className="d-ph-ini">{initialsOf(person.full_name)}</span>
                        )}
                      </span>
                      <b>{person.full_name}</b>
                      {person.headline || person.business_name ? (
                        <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 14 }}>
                          {person.headline || person.business_name}
                        </span>
                      ) : null}
                      {whereOf(person.village_id) ? (
                        <span className="d-small" style={{ display: "block", marginTop: 8, fontSize: 13 }}>
                          {whereOf(person.village_id)}
                        </span>
                      ) : null}
                      {person.industry ? (
                        <span className="d-small" style={{ display: "block", marginTop: 2, fontSize: 13 }}>
                          {person.industry}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section style={{ padding: "96px 0 104px" }}>
            <div className="d-wrap d-notify">
              <div className="d-inkbox">
                <span style={{ display: "block", marginBottom: 22 }}>
                  <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.nadia]} size={44} />
                </span>
                <h2 className="d-h2 d-light">Members see more than this</h2>
                <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: "#B9C3CD", maxWidth: "46ch" }}>
                  What somebody is looking for, what they can help with, and how to
                  reach them stay inside the platform.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: "auto", paddingTop: 28 }}>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">
                    Request an invitation
                    <Arrow />
                  </Link>
                  <Link className="d-btn d-btn-ghost" href="/membership">
                    What membership costs
                  </Link>
                </div>
              </div>
              <div className="d-boxed d-form">
                <h3 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>Not ready to ask yet?</h3>
                <p className="d-body" style={{ marginTop: 10, fontSize: 16 }}>
                  We write when there is an open event you could come to, or
                  news worth your time. Nothing else, and you can stop at any
                  point.
                </p>
                <div style={{ marginTop: 22 }}>
                  <SubscribeForm source="members" />
                </div>
              </div>
            </div>
          </section>
        </div>
        </PageBlocks>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(me)} nav="/directory" active="/members">
      <PageBlocks data={{ people: people ?? [] }} slug="members">
        <section className={me ? "sec" : "pubsec hero-center"}>
          <h1>Members</h1>
          <p className="lead">
            People building a business away from home, in every Village.
          </p>

          <div className="g3" style={{ marginTop: 20 }}>
            <div className="panel">
              <h3 style={{ fontSize: 15 }}>
                {totalMembers} {totalMembers === 1 ? "member" : "members"}
              </h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                {livedVillages === 1
                  ? "in one Village"
                  : `across ${livedVillages} Villages`}
              </p>
            </div>
            <div className="panel">
              <h3 style={{ fontSize: 15 }}>Where they are from</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                {(nationalities ?? []).length
                  ? (nationalities ?? [])
                      .map((n: { nationality: string }) => n.nationality)
                      .join(" · ")
                  : "Told once there are enough members to say without naming anybody."}
              </p>
            </div>
            <div className="panel">
              <h3 style={{ fontSize: 15 }}>What they do</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                {(industries ?? []).length
                  ? (industries ?? [])
                      .map((i: { industry: string }) => i.industry)
                      .join(" · ")
                  : "Every trade you would expect in a city, and some you would not."}
              </p>
            </div>
          </div>

          <p className="muted small" style={{ marginTop: 16 }}>
            {me
              ? "These are the members who chose to be listed publicly."
              : "A few members who chose to be listed publicly are below. The rest of the Directory is for members."}
          </p>

          <form className="searchrow" action="/members" style={{ marginTop: 20 }}>
            {village ? <input type="hidden" name="village" value={village} /> : null}
            <input
              name="q"
              defaultValue={q}
              placeholder="An industry, a market, a name"
              aria-label="Search members"
            />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>

          <div className="tabs">
            <Link
              className={`chip ${village ? "" : "chip-mint"}`}
              href={`/members${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            >
              Everywhere
            </Link>
            {(villages ?? []).map((v) => (
              <Link
                className={`chip ${village === v.slug ? "chip-mint" : ""}`}
                href={`/members?village=${v.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                key={v.id}
              >
                {v.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {featured.length === 0 ? (
            <p className="muted">
              Nobody matches that yet. Most members keep their profile inside
              the platform, which is their choice to make.
            </p>
          ) : (
            <div className="g3">
              {featured.map((person) => (
                <MemberCard
                  key={person.id}
                  person={person}
                  where={
                    villageName(person.village_id)
                      ? `${villageName(person.village_id)} Village`
                      : ""
                  }
                />
              ))}
            </div>
          )}
        </section>

        {me ? null : (
          <section className="sec">
            <h2>Members see more than this</h2>
            <p className="lead">
              What somebody is looking for, what they can help with, and how to
              reach them stay inside the platform.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>{" "}
              <Link className="btn btn-ghost" href="/membership">
                What membership costs
              </Link>
            </p>

            <div className="panel panel-wash" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15 }}>Not ready to ask yet?</h3>
              <p className="muted small" style={{ margin: "6px 0 12px" }}>
                We write when there is an open event you could come to, or
                news worth your time. Nothing else, and you can stop at any
                point.
              </p>
              <SubscribeForm source="members" />
            </div>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
