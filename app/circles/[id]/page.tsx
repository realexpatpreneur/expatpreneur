import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { whenText } from "@/lib/events";
import { Av } from "@/components/bits";

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
    .select("id, name, village_id, capacity, status, host_id")
    .eq("id", id)
    .maybeSingle();

  if (!circle) notFound();

  const mine = circle.id === member.circle_id;

  // The group link lives behind a view that hands it out only for a
  // member's own Circle, and only while their membership is live.
  const { data: room } = await supabase
    .from("circle_rooms")
    .select("whatsapp_url")
    .eq("id", circle.id)
    .maybeSingle();

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
            .select("id, full_name, headline, avatar_url")
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

  const pct = circle.capacity ? Math.min(100, Math.round((size / circle.capacity) * 100)) : 0;
  const faces = (members ?? []).slice(0, 8);

  return (
    <WorkspaceShell kind="member" nav="/circles">
      <nav className="m-crumb" aria-label="Breadcrumb">
        <Link href="/my-village">{village?.name ?? "Your"} Village</Link>
        <span>/</span>
        <Link href="/my-village/circles">Circles</Link>
        <span>/</span>
        <span>{circle.name}</span>
      </nav>

      <header className="m-chead">
        <div>
          <span className="m-kind" style={{ color: "#A8DCD1" }}>
            {mine ? "Your home base" : `${village?.name ?? "This"} Village`}
          </span>
          <h1>{circle.name}</h1>
          <p>
            {circle.status === "preparing"
              ? "Being prepared for new members."
              : `${size} of ${circle.capacity} members${host ? `, hosted by ${host.full_name}` : ""}.`}
          </p>
          <div className="m-meter" aria-label={`${size} of ${circle.capacity} places taken`}>
            <i style={{ width: `${pct}%` }} />
          </div>
          {mine && room?.whatsapp_url ? (
            <a className="btn btn-mint m-shine" href={room.whatsapp_url} target="_blank" rel="noreferrer" style={{ marginTop: 22, height: 44, padding: "0 18px", fontSize: 14, position: "relative", overflow: "hidden" }}>
              Open the WhatsApp group
            </a>
          ) : null}
        </div>
        {mine && faces.length ? (
          <div className="m-faces m-chead-faces">
            {faces.map((f) => (
              <Av key={f.id} name={f.full_name} className="av-lg" src={f.avatar_url ?? null} />
            ))}
          </div>
        ) : null}
      </header>

      <div className="m-vgrid">
        <div style={{ minWidth: 0 }}>
          {mine ? null : (
            <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8", marginBottom: 24 }}>
              <p className="m-muted" style={{ margin: 0, fontSize: 15 }}>
                {circle.status === "preparing"
                  ? `${circle.name} is being prepared for new members.`
                  : `You can see this Circle, but its conversation and its group are for its own members. Your home base is elsewhere in ${village?.name ?? "this Village"}.`}
              </p>
            </div>
          )}

          <div className="m-cardhead">
            <h2 className="m-h2">Members</h2>
            <Link className="m-ulink" href="/directory">
              The Directory
            </Link>
          </div>
          {!mine ? (
            <p className="m-muted" style={{ marginTop: 10, fontSize: 15 }}>
              {size} {size === 1 ? "member" : "members"}. The Directory shows
              everybody in the Village.
            </p>
          ) : size === 0 ? (
            <p className="m-muted" style={{ marginTop: 10, fontSize: 15 }}>
              Nobody here yet.
            </p>
          ) : (
            <div className="m-people">
              {(members ?? []).map((person) => (
                <Link className="m-person" href={`/members/${person.id}`} key={person.id}>
                  <Av name={person.full_name} className="av-lg" src={person.avatar_url ?? null} />
                  <span style={{ minWidth: 0 }}>
                    <b>
                      {person.full_name}
                      {person.id === member.id ? " (you)" : ""}
                    </b>
                    <span className="m-muted">{person.headline}</span>
                  </span>
                  {person.id === circle.host_id ? <span className="m-kind m-offer" style={{ fontSize: 11 }}>Host</span> : null}
                </Link>
              ))}
            </div>
          )}

          {mine && (events ?? []).length ? (
            <>
              <h2 className="m-h2" style={{ marginTop: 44 }}>Circle events</h2>
              <div style={{ marginTop: 12 }}>
                {(events ?? []).map((event) => {
                  const d = new Date(event.starts_at);
                  return (
                    <Link className="m-row" href={`/events/${event.slug}`} key={event.id} style={{ gridTemplateColumns: "40px minmax(0,1fr)" }}>
                      <span className="m-date">
                        <b>{d.getDate()}</b>
                        <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                      </span>
                      <span>
                        <b style={{ display: "block" }}>{event.title}</b>
                        <span className="m-muted">{whenText(event)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <aside style={{ display: "grid", gap: 20 }}>
          {host ? (
            <div className="m-card">
              <h3>Host</h3>
              <Link className="m-row" href={`/members/${host.id}`} style={{ marginTop: 10, gridTemplateColumns: "56px minmax(0,1fr)" }}>
                <Av name={host.full_name} className="av-lg" src={host.avatar_url ?? null} />
                <span>
                  <b style={{ display: "block" }}>{host.full_name}</b>
                  {host.headline ? <span className="m-muted">{host.headline}</span> : null}
                </span>
              </Link>
              {mine ? (
                <Link className="btn btn-ghost btn-sm" href={`/messages/${host.id}`} style={{ marginTop: 8 }}>
                  Message {host.full_name.split(" ")[0]}
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
            <h3>What a Circle is</h3>
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
              Up to fifty people who are meant to know each other, inside a
              Village that can be any size. Yours is where the WhatsApp group
              and the smaller gatherings live.
            </p>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
