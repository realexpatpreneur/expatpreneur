import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { JoinGroupButton } from "../forms";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/groups");
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("industry_groups")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) notFound();

  const [{ data: members }, { data: lead }] = await Promise.all([
    supabase.from("group_members").select("profile_id").eq("group_id", group.id),
    group.lead_id
      ? supabase
          .from("profiles")
          .select("id, full_name, headline")
          .eq("id", group.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ids = (members ?? []).map((m) => m.profile_id);
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline, village_id")
        .in("id", ids)
        .limit(60)
    : { data: [] };

  const { data: villages } = await supabase.from("villages").select("id, name");
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const joined = ids.includes(member.id);

  return (
    <WorkspaceShell kind="member" nav="/groups">
        <section className="sec">
          <p className="muted small">
            <Link href="/groups">Industry Groups</Link>
          </p>
          <p>
            <span className="chip">{group.industry}</span>{" "}
            <span className={`chip ${group.status === "open" ? "chip-mint" : ""}`}>
              {group.status}
            </span>
          </p>
          <h1>{group.name}</h1>
          <p className="lead">{group.description}</p>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <h3>Who is in it</h3>
              {(people ?? []).length === 0 ? (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Nobody yet. Being first is not a bad place to be.
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {(people ?? []).map((person) => (
                    <Link
                      className="li linkrow"
                      key={person.id}
                      href={`/members/${person.id}`}
                    >
                      <div>
                        <b>{person.full_name}</b>
                        <div className="muted small">
                          {person.headline}
                          {person.village_id
                            ? `. ${villageName(person.village_id)}`
                            : ""}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="panel">
                <JoinGroupButton groupId={group.id} slug={group.slug} joined={joined} />
                {joined && group.whatsapp_url ? (
                  <p style={{ marginTop: 12 }}>
                    <a
                      className="btn mint"
                      href={group.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the WhatsApp group
                    </a>
                  </p>
                ) : null}
              </div>

              {lead ? (
                <div className="panel">
                  <h3>Led by</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/members/${lead.id}`}>{lead.full_name}</Link>
                    {lead.headline ? `, ${lead.headline}` : ""}
                  </p>
                </div>
              ) : null}

              <div className="panel panel-wash">
                <h3>What happens here</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Questions that only make sense inside the trade: suppliers,
                  margins, licensing, the people worth knowing. Still no
                  pitching.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}