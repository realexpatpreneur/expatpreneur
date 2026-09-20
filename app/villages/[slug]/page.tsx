import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whenText } from "@/lib/events";

const statusLine: Record<string, string> = {
  open: "Open, by invitation",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused for now",
  archived: "Closed",
};

export default async function VillagePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: village } = await supabase
    .from("villages")
    .select("id, slug, name, city, country, status, summary")
    .eq("slug", slug)
    .maybeSingle();

  if (!village) notFound();

  // Only what a stranger is allowed to see: members who chose to be public,
  // and events open to everyone.
  const [{ count: memberCount }, { data: events }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("village_id", village.id)
      .eq("status", "active"),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue")
      .eq("village_id", village.id)
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(6),
  ]);

  return (
    <WorkspaceShell kind="member" nav="/villages">
        <section className="band">
          <p>
            <span className={`chip ${village.status === "open" ? "mint" : ""}`}>
              {statusLine[village.status] ?? village.status}
            </span>
          </p>
          <h1>{village.name}</h1>
          <p className="lead">
            {village.city}, {village.country}. {village.summary}
          </p>
          <p>
            {village.status === "exploring" ? (
              <Link className="btn primary" href="/villages/suggest">
                Tell us you are there
              </Link>
            ) : (
              <Link className="btn primary" href="/apply">
                Request an invitation
              </Link>
            )}{" "}
            <Link className="btn" href="/villages">
              All Villages
            </Link>
          </p>
        </section>

        <section className="band">
          <div className="grid three">
            <div className="panel">
              <h3>Circles</h3>
              <p className="muted small">
                Up to fifty members each. Small enough that people actually know
                each other, and meet often enough to prove it.
              </p>
            </div>
            <div className="panel">
              <h3>Members</h3>
              <p className="muted small">
                {memberCount ?? 0} people building businesses here, from
                somewhere else.
              </p>
            </div>
            <div className="panel">
              <h3>How you get in</h3>
              <p className="muted small">
                By invitation. Every request is read by a person, and the Local
                Admin decides.
              </p>
            </div>
          </div>
        </section>

        {(events ?? []).length ? (
          <section className="band">
            <h2>Open to everyone</h2>
            <div className="rows">
              {(events ?? []).map((event) => (
                <Link className="rowlink" key={event.id} href={`/e/${event.slug}`}>
                  <div>
                    <b>{event.title}</b>
                    <div className="muted small">
                      {whenText(event)}. {event.venue ?? "Online"}.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="band">
          <div className="band cta">
            <h2>
              {village.status === "exploring"
                ? `Want a Village in ${village.city}?`
                : `Building something in ${village.city}?`}
            </h2>
            <p style={{ color: "#fff" }}>
              {village.status === "exploring"
                ? "It opens when enough people ask and someone local will run it."
                : "Membership is free. The paid plan adds every other Village."}
            </p>
            <Link
              className="btn"
              href={village.status === "exploring" ? "/villages/suggest" : "/apply"}
            >
              {village.status === "exploring"
                ? "Register interest"
                : "Request an invitation"}
            </Link>
          </div>
        </section>
      </WorkspaceShell>
  );
}