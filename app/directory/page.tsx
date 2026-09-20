import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";

export const metadata = { title: "Directory, ExpatPreneurs Global" };

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; village?: string }>;
}) {
  const { q = "", village = "mine" } = await searchParams;
  const member = await requireMember("/directory");
  const supabase = await createClient();

  const { data: villages } = await supabase
    .from("villages")
    .select("id, name")
    .order("name");

  // Your own Village is open to every member. The rest of the network
  // is part of the paid plan.
  const paid = isPaid(member);
  const scope = village === "all" && paid ? "all" : "mine";

  let query = supabase
    .from("profiles")
    .select("id, full_name, headline, business_name, industry, village_id, circle_id, avatar_url")
    .eq("status", "active")
    .order("full_name")
    .limit(100);

  if (scope === "mine" && member.village_id) {
    query = query.eq("village_id", member.village_id);
  }
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,headline.ilike.%${q}%,business_name.ilike.%${q}%,industry.ilike.%${q}%`
    );
  }

  const { data: people } = await query;
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <WorkspaceShell kind="member" nav="/directory">
        <section className="sec">
          <h1>Directory</h1>
          <p className="lead">
            {scope === "mine"
              ? `Members in the ${member.villageName ?? "your"} Village.`
              : "Members across every Village."}
          </p>
          <form className="searchrow">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, business, industry"
            />
            <input type="hidden" name="village" value={scope} />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>
          <div className="tabs">
            <Link
              className={`chip ${scope === "mine" ? "chip-mint" : ""}`}
              href="/directory?village=mine"
            >
              My Village
            </Link>
            {paid ? (
              <Link
                className={`chip ${scope === "all" ? "chip-mint" : ""}`}
                href="/directory?village=all"
              >
                Every Village
              </Link>
            ) : (
              <Link className="chip" href="/upgrade">
                Every Village, with the paid plan
              </Link>
            )}
          </div>
        </section>

        <section className="sec">
          {(people ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nobody matches that yet.
              </p>
            </div>
          ) : (
            <div className="g3">
              {(people ?? []).map((person) => (
                <Link className="panel" key={person.id} href={`/members/${person.id}`}>
                  <div className="facerow">
                    {person.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img className="face" src={person.avatar_url} alt="" />
                    ) : null}
                    <h3 style={{ margin: 0 }}>{person.full_name}</h3>
                  </div>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    {person.headline || person.business_name || "Member"}
                  </p>
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    {person.industry ? `${person.industry}. ` : ""}
                    {villageName(person.village_id)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}