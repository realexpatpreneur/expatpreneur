import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import { MemberCard } from "@/components/member-card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SubscribeForm } from "@/app/media/subscribe-form";

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
                      .join(" \u00b7 ")
                  : "Told once there are enough members to say without naming anybody."}
              </p>
            </div>
            <div className="panel">
              <h3 style={{ fontSize: 15 }}>What they do</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                {(industries ?? []).length
                  ? (industries ?? [])
                      .map((i: { industry: string }) => i.industry)
                      .join(" \u00b7 ")
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