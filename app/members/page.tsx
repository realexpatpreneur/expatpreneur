import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

export const metadata = {
  title: "Members, ExpatPreneurs Global",
  description:
    "Members who chose to be listed publicly, across every Village.",
};

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

export default async function PublicMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ village?: string; q?: string }>;
}) {
  const { village = "", q = "" } = await searchParams;
  const supabase = await createClient();
  const me = await whoIsHere();

  const [{ data: villages }, { data: everyone }] = await Promise.all([
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
  ]);

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

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <WorkspaceShell kind="member" nav="/members">
        <section className={me ? "sec" : "pubsec hero-center"}>
          <h1>Members</h1>
          <p className="lead">
            People building a business away from home, in every Village. These
            are the members who chose to be listed publicly.
          </p>

          <form className="searchrow" action="/members" style={{ marginTop: 18 }}>
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
          {people.length === 0 ? (
            <p className="muted">
              Nobody matches that yet. Most members keep their profile inside
              the platform, which is their choice to make.
            </p>
          ) : (
            <div className="g3 g4">
              {people.map((person, i) => (
                <Link className="card" href={`/members/${person.id}`} key={person.id}>
                  {person.avatar_url ? (
                    <div className="cover photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.avatar_url} alt="" />
                    </div>
                  ) : (
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {person.full_name
                        .split(" ")
                        .map((part: string) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="kind">
                    {person.industry ?? person.business_name ?? ""}
                  </div>
                  <p>
                    <b>{person.full_name}</b>
                    {person.headline ? `. ${person.headline}` : ""}
                  </p>
                  <div className="meta">
                    <span className="chip">{villageName(person.village_id)}</span>
                  </div>
                </Link>
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
          </section>
        )}
      </WorkspaceShell>
  );
}