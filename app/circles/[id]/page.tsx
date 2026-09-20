import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { whenText } from "@/lib/events";

// A Circle's own page. A member can see any Circle in their Village, but
// the WhatsApp link appears only on their own, and so do its members.
export default async function CirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember("/my-village");
  const supabase = await createClient();

  const { data: circle } = await supabase
    .from("circles")
    .select("id, name, village_id, capacity, status, whatsapp_url, host_id")
    .eq("id", id)
    .maybeSingle();

  if (!circle) notFound();

  const mine = circle.id === member.circle_id;

  const [{ data: members }, { data: host }, { data: village }, { data: events }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, headline, avatar_url")
        .eq("circle_id", circle.id)
        .eq("status", "active")
        .order("full_name"),
      circle.host_id
        ? supabase
            .from("profiles")
            .select("id, full_name, headline")
            .eq("id", circle.host_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("villages")
        .select("name")
        .eq("id", circle.village_id)
        .maybeSingle(),
      mine
        ? supabase
            .from("events")
            .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online")
            .eq("audience", "circle")
            .eq("audience_id", circle.id)
            .eq("status", "published")
            .gte("starts_at", new Date().toISOString())
            .order("starts_at")
            .limit(3)
        : Promise.resolve({ data: [] }),
    ]);

  const size = (members ?? []).length;

  return (
    <WorkspaceShell kind="member" nav="/circles">
        <section className="sec">
          <p className="muted small">
            <Link href="/my-village">{village?.name ?? "Your"} Village</Link>
          </p>
          <h1>{circle.name}</h1>
          <p className="lead">
            {circle.status === "preparing"
              ? "Being prepared for new members."
              : `${size} of ${circle.capacity} members${
                  host ? `, hosted by ${host.full_name}` : ""
                }.`}
          </p>
          {mine && circle.whatsapp_url ? (
            <p>
              <a
                className="btn btn-primary"
                href={circle.whatsapp_url}
                target="_blank"
                rel="noreferrer"
              >
                Open the WhatsApp group
              </a>
            </p>
          ) : null}
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {mine ? null : (
                <div className="panel panel-wash">
                  <p className="muted small" style={{ margin: 0 }}>
                    {circle.status === "preparing"
                      ? `${circle.name} is being prepared for new members.`
                      : `You can see this Circle, but its conversation and its group are for its own members. Your home base is elsewhere in ${village?.name ?? "this Village"}.`}
                  </p>
                </div>
              )}

              <div className="panel">
                <h3>Members</h3>
                {!mine ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {size} {size === 1 ? "member" : "members"}. The Directory
                    shows everybody in the Village.
                  </p>
                ) : size === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody here yet.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(members ?? []).map((person) => (
                      <Link
                        className="li linkrow"
                        href={`/members/${person.id}`}
                        key={person.id}
                      >
                        <div>
                          <b>
                            {person.full_name}
                            {person.id === member.id ? " (you)" : ""}
                          </b>
                          <div className="muted small">{person.headline}</div>
                        </div>
                        <div className="rowmeta">
                          {person.id === circle.host_id ? (
                            <span className="chip chip-mint">Host</span>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <p style={{ marginTop: 12 }}>
                  <Link className="btn btn-ghost" href="/directory">
                    The Directory
                  </Link>
                </p>
              </div>

              {mine && (events ?? []).length ? (
                <div className="panel">
                  <h3>Circle events</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(events ?? []).map((event) => (
                      <Link
                        className="li linkrow"
                        href={`/events/${event.slug}`}
                        key={event.id}
                      >
                        <div>
                          <b>{event.title}</b>
                          <div className="muted small">{whenText(event)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="stack">
              {host ? (
                <div className="panel">
                  <h3>Host</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    <Link href={`/members/${host.id}`}>{host.full_name}</Link>
                    {host.headline ? `. ${host.headline}` : ""}
                  </p>
                  {mine ? (
                    <Link className="btn btn-ghost" href={`/messages/${host.id}`}>
                      Message {host.full_name.split(" ")[0]}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="panel panel-wash">
                <h3>What a Circle is</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Up to fifty people who are meant to know each other, inside
                  a Village that can be any size. Yours is where the WhatsApp
                  group and the smaller gatherings live.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}