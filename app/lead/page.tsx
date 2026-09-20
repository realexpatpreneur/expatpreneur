import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { Ic } from "@/components/icon";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { sessionWhen } from "@/lib/live";
import { OpenRoomForm, GroupForm, PodForm } from "./forms";

export const metadata = { title: "What you run, ExpatPreneurs Global" };

const roleLabel: Record<string, string> = {
  local_admin: "Local Admin",
  circle_host: "Circle Host",
  industry_lead: "Industry Lead",
  pod_lead: "Pod Lead",
  educator: "Educator",
};

export default async function LeadPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const member = await requireMember("/lead");
  const supabase = await createClient();

  const [{ data: leadership }, { data: roles }] = await Promise.all([
    supabase
      .from("my_leadership")
      .select("role, kind, thing_id, thing_name, people")
      .eq("profile_id", member.id),
    supabase
      .from("member_roles")
      .select("role")
      .eq("profile_id", member.id)
      .is("ended_at", null),
  ]);

  const isEducator = (roles ?? []).some((r) =>
    ["educator", "global_admin"].includes(r.role)
  );

  if (!(leadership ?? []).length && !isEducator) {
    return (
      <WorkspaceShell kind="lead">
        <PageHead
          title="Nothing to run yet"
          sub="This is where Circle Hosts, Industry Leads, Pod Leads and Educators find what they are responsible for. Roles are given by the Global team, and reviewed once a year."
        />
        <Link className="btn btn-ghost" href="/home">
          Back to home
        </Link>
      </WorkspaceShell>
    );
  }

  const circleIds = (leadership ?? [])
    .filter((l) => l.kind === "circle")
    .map((l) => l.thing_id);
  const groupIds = (leadership ?? [])
    .filter((l) => l.kind === "group")
    .map((l) => l.thing_id);
  const podIds = (leadership ?? [])
    .filter((l) => l.kind === "pod")
    .map((l) => l.thing_id);

  const [{ data: circleMembers }, { data: groups }, { data: pods }, { data: sessions }] =
    await Promise.all([
      circleIds.length
        ? supabase
            .from("profiles")
            .select("id, full_name, headline, circle_id, status")
            .in("circle_id", circleIds)
            .eq("status", "active")
        : Promise.resolve({ data: [] }),
      groupIds.length
        ? supabase
            .from("industry_groups")
            .select("id, name, description, whatsapp_url")
            .in("id", groupIds)
        : Promise.resolve({ data: [] }),
      podIds.length
        ? supabase
            .from("pods")
            .select("id, name, purpose, whatsapp_url, cadence")
            .in("id", podIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("live_sessions")
        .select("id, slug, title, scheduled_start, scheduled_end, timezone, status")
        .eq("created_by", member.id)
        .in("status", ["scheduled", "live"])
        .order("scheduled_start")
        .limit(5),
    ]);

  const things = (leadership ?? []).map((l) => ({
    value: `${l.kind}:${l.thing_id}`,
    label: `${l.thing_name}, ${l.people} ${l.people === 1 ? "member" : "members"}`,
  }));

  return (
    <WorkspaceShell kind="lead">
        <PageHead
          title="What you run"
          sub="The people you are responsible for, and the room you can open for them."
        />
        {done ? (
          <div className="flag ok">
            <Ic name="check" />
            <span>Scheduled.</span>
          </div>
        ) : null}

        <div className="flag ok" style={{ marginBottom: 16 }}>
          <Ic name="shield" />
          <span>
            You see what you lead and nothing else. Applications, the Village
            mix and other Circles stay with the Local Admins.
          </span>
        </div>

        <section className="sec">
          <div className="g3">
            {(leadership ?? []).map((l, i) => (
              <div className="circlecard has-cover" key={`${l.kind}-${l.thing_id}`}>
                <span className={`ctile ct-${["blue", "mint", "navy", "sun"][i % 4]}`}>
                  <b>{l.thing_name}</b>
                  <span>
                    {l.people} {l.people === 1 ? "member" : "members"}
                  </span>
                </span>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <span className="chip chip-mint">
                    {roleLabel[l.role] ?? l.role}
                  </span>
                </div>
              </div>
            ))}
            {isEducator ? (
              <Link className="circlecard has-cover linkrow" href="/educator">
                <span className="ctile ct-pink">
                  <b>Your courses</b>
                  <span>Write and publish them here</span>
                </span>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <span className="chip">Educator</span>
                </div>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {circleIds.length ? (
                <div className="panel">
                  <h3>Your Circle</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Knowing who has gone quiet is most of the job. A message
                    from you lands better than anything the platform sends.
                  </p>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(circleMembers ?? []).map((person) => (
                      <div className="li linkrow" key={person.id}>
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">{person.headline}</div>
                        </div>
                        <div className="rowmeta">
                          <Link className="btn btn-ghost" href={`/messages/${person.id}`}>
                            Message
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(groups ?? []).map((group) => (
                <div className="panel" key={group.id}>
                  <h3>{group.name}</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/groups/${group.id}`}>See it as a member</Link>
                  </p>
                  <GroupForm group={group} />
                </div>
              ))}

              {(pods ?? []).map((pod) => (
                <div className="panel" key={pod.id}>
                  <h3>{pod.name}</h3>
                  <PodForm pod={pod} />
                </div>
              ))}
            </div>

            <div className="stack">
              {things.length ? <OpenRoomForm things={things} /> : null}

              {(sessions ?? []).length ? (
                <div className="panel">
                  <h3>Rooms you opened</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(sessions ?? []).map((session) => (
                      <Link
                        className="li linkrow"
                        key={session.id}
                        href={`/live/${session.slug}`}
                      >
                        <div>
                          <b>{session.title}</b>
                          <div className="muted small">{sessionWhen(session)}</div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${session.status === "live" ? "chip-mint" : ""}`}
                          >
                            {session.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="panel panel-wash">
                <h3>What the role is</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Turning up, noticing who has gone quiet, and making
                  introductions. It is reviewed once a year, and stepping down
                  is normal rather than a failure.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}