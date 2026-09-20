import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { NotifyButton } from "./forms";

export const metadata = { title: "The Global network, ExpatPreneurs Global" };

// The Global layer from a member's point of view: every Village, with what
// they can do in each.
export default async function NetworkPage() {
  const member = await requireMember("/network");
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }, { data: interest }] =
    await Promise.all([
      supabase
        .from("villages")
        .select("id, slug, name, city, country, status, summary")
        .order("name"),
      supabase
        .from("profiles")
        .select("village_id")
        .eq("status", "active"),
      supabase
        .from("village_interest")
        .select("village_id")
        .eq("profile_id", member.id),
    ]);

  const membersIn = (id: string) =>
    (counts ?? []).filter((c) => c.village_id === id).length;

  const asked = (id: string) =>
    (interest ?? []).some((i) => i.village_id === id);

  const open = (villages ?? []).filter((v) => v.status === "open");
  const soon = (villages ?? []).filter((v) =>
    ["launching", "exploring"].includes(v.status)
  );

  const paid = isPaid(member);

  return (
    <WorkspaceShell kind="member" nav="/network">
        <section className="band">
          <p className="muted small">
            <Link href="/home">Home</Link>
          </p>
          <h1>The Global network</h1>
          <p className="lead">
            {open.length} {open.length === 1 ? "Village is" : "Villages are"}{" "}
            open
            {soon.length
              ? `, and ${soon.length} more ${soon.length === 1 ? "is" : "are"} on the way.`
              : "."}
          </p>

          {paid ? null : (
            <div className="panel wash" style={{ marginTop: 14 }}>
              <p className="muted small" style={{ margin: 0 }}>
                You can browse every Village. Contacting members and
                attending events in other Villages comes with the paid plan.
              </p>
              <p style={{ marginTop: 10 }}>
                <Link className="btn" href="/upgrade">
                  See the paid plan
                </Link>
              </p>
            </div>
          )}
        </section>

        <section className="band">
          <div className="grid">
            {open.map((village) => {
              const mine = village.id === member.village_id;
              return (
                <article className="card" key={village.id}>
                  <div className={`cover ${mine ? "mint" : "blue"}`}>
                    {village.city}
                  </div>
                  <div className="kind">{village.country}</div>
                  <p>
                    <b>{village.name}</b>
                    {village.summary ? `. ${village.summary}` : ""}
                  </p>
                  <div className="meta">
                    <span className="chip">
                      {mine ? "Your Village" : `${membersIn(village.id)} members`}
                    </span>
                  </div>
                  <p style={{ marginTop: 10 }}>
                    {mine ? (
                      <Link className="btn" href="/my-village">
                        Open
                      </Link>
                    ) : paid ? (
                      <>
                        <Link
                          className="btn"
                          href={`/directory?village=${village.slug}`}
                        >
                          Members
                        </Link>{" "}
                        <Link className="btn" href="/events">
                          Events
                        </Link>
                      </>
                    ) : (
                      <Link className="btn" href={`/villages/${village.slug}`}>
                        Look around
                      </Link>
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {soon.length ? (
          <section className="band">
            <h2>On the way</h2>
            <div className="grid" style={{ marginTop: 16 }}>
              {soon.map((village) => (
                <article className="card" key={village.id}>
                  <div className="cover paper">{village.city}</div>
                  <div className="kind">{village.country}</div>
                  <p>
                    <b>{village.name}</b>
                    {village.summary ? `. ${village.summary}` : ""}
                  </p>
                  <div className="meta">
                    <span className="chip">
                      {village.status === "launching" ? "Launching" : "Being explored"}
                    </span>
                  </div>
                  <NotifyButton villageId={village.id} already={asked(village.id)} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="band">
          <div className="panel wash">
            <h3>Moving city?</h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Your profile and your history come with you. Ask to transfer to
              the Village in your new city.
            </p>
            <Link className="btn" href="/settings/transfer">
              Request a transfer
            </Link>
          </div>
        </section>
      </WorkspaceShell>
  );
}