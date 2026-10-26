import { WorkspaceShell } from "@/components/workspace-shell";
import { MemberCard } from "@/components/member-card";
import { Lock } from "@/components/lock";
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

  const [{ data: villages }, { data: circles }] = await Promise.all([
    supabase.from("villages").select("id, name").order("name"),
    supabase.from("circles").select("id, name, village_id").order("name"),
  ]);

  // Looking is open to every member, which is what the page has always
  // said in the line below the tabs. Contacting somebody in another
  // Village is the part that needs Village Membership, and the member card
  // applies that itself.
  //
  // What a free member finds elsewhere is whoever chose to be listed
  // publicly, since that is what row level security lets them read. The
  // line under the heading says so rather than promising the lot.
  const paid = isPaid(member);
  const scope = village === "all" ? "all" : "mine";

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, headline, business_name, industry, village_id, circle_id, avatar_url, founding"
    )
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

  const { data: rows } = await query;
  const people = (rows ?? []).filter((person) => person.id !== member.id);

  // Where a connection with somebody already stands, so a card can say
  // so rather than ask again.
  const { data: links } = await supabase
    .from("connection_requests")
    .select("requester_id, recipient_id, status")
    .or(`requester_id.eq.${member.id},recipient_id.eq.${member.id}`);

  const connection = new Map<string, string>();
  for (const link of links ?? []) {
    const them =
      link.requester_id === member.id ? link.recipient_id : link.requester_id;
    connection.set(them, link.status);
  }

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  // The Village, then the Circle, as the prototype has it. The Circle
  // name drops the Village it repeats.
  const where = (person: { village_id: string | null; circle_id: string | null }) => {
    const village = villageName(person.village_id);
    const circle = person.circle_id
      ? (circles?.find((c) => c.id === person.circle_id)?.name ?? "")
      : "";
    const short = circle.startsWith(`${village} `)
      ? circle.slice(village.length + 1)
      : circle;
    return short ? `${village}, ${short}` : village;
  };

  const viewer = { id: member.id, village_id: member.village_id, paid };

  return (
    <WorkspaceShell kind="member" nav="/directory">
        <section className="sec">
          <h1>Directory</h1>
          <p className="lead">
            {scope === "mine"
              ? `Members in the ${member.villageName ?? "your"} Village.`
              : paid
                ? "Members across every Village."
                : "Your own Village in full, and members elsewhere who are listed publicly."}
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
            <Link
              className={`chip ${scope === "all" ? "chip-mint" : ""}`}
              href="/directory?village=all"
            >
              Every Village
            </Link>
          </div>
        </section>

        <section className="sec">
          {paid ? null : (
            <Lock style={{ marginBottom: 20 }}>
              You can browse every Village. Contacting members in other
              Villages is included with Village Membership.
            </Lock>
          )}

          {people.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nobody matches that yet.
              </p>
            </div>
          ) : (
            <>
              <p className="muted small" style={{ marginBottom: 12 }}>
                {people.length} member{people.length === 1 ? "" : "s"}
              </p>
              <div className="g3">
                {people.map((person) => (
                  <MemberCard
                    key={person.id}
                    person={person}
                    where={where(person)}
                    viewer={viewer}
                    requested={connection.get(person.id) === "pending"}
                    connected={connection.get(person.id) === "accepted"}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </WorkspaceShell>
  );
}