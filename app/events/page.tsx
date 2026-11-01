import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
import { whoIsHere, isPaid } from "@/lib/member";
import { SubscribeForm } from "@/app/media/subscribe-form";
import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { Arrow, Faces, PHOTO } from "@/components/design/parts";
import { PageHead } from "@/components/workspace-shell";
import {
  whenText,
  priceText,
  registrationBlock,
  type EventRow as EventData,
} from "@/lib/events";

export const metadata = { title: "Events, ExpatPreneurs Global" };

// Open to everyone. A visitor sees the events that are open to the
// public; a member sees theirs, other Villages' and everything online.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();
  const t = await pageText("events");

  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  if (!member) query = query.eq("visibility", "public");

  const [{ data: events }, { data: registrations }, { data: villages }] =
    await Promise.all([
      query,
      member
        ? supabase
            .from("event_registrations")
            .select("event_id, status")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
      supabase.from("villages").select("id, name"),
    ]);

  const registeredFor = new Set(
    (registrations ?? [])
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.event_id)
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const rows = ((events ?? []) as EventData[]).filter((event) => {
    if (!member) return true;
    if (show === "mine") return registeredFor.has(event.id);
    if (show === "village") return event.village_id === member.village_id;
    if (show === "other")
      return event.village_id && event.village_id !== member.village_id;
    if (show === "online") return event.is_online;
    return true;
  });

  const FILTERS: [string, string][] = [
    ["all", "All"],
    ["village", "My Village"],
    ["other", "Other Villages"],
    ["online", "Online"],
    ["mine", "I am going"],
  ];

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    const [lead, ...later] = rows;
    const dayOf = (iso: string) => new Date(iso);
    const where = (e: EventData) =>
      `${e.village_id ? `${villageName(e.village_id)}. ` : ""}${whenText(e)}${
        e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""
      }`;
    return (
      <PublicPage active="/events">
        <PageBlocks data={{ events: events ?? [] }} slug="events">
        <div className="d-page">
          <section style={{ padding: "64px 0 80px" }}>
            <div className="d-wrap d-hero">
              <div>
                <p className="d-eyebrow">Events</p>
                <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "15ch" }}>{t("title", "Gatherings in every Village, and online.")}</h1>
                <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                  {t("intro", "Gatherings in every Village and online. Some are open to everyone; most are for members.")}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
                  <Faces srcs={[PHOTO.nadia, PHOTO.tomas, PHOTO.julien]} size={44} />
                  <p className="d-body" style={{ fontSize: 14 }}>
                    Every Village holds at least one gathering a month, and members can visit the others.
                  </p>
                </div>
              </div>
              <div className="d-collage" role="img" aria-label="Members of the network and the table at a founders dinner">
                {/* eslint-disable @next/next/no-img-element */}
                <img src={PHOTO.members} alt="" style={{ left: 0, top: 0, width: "62%", height: "72%" }} />
                <img src={PHOTO.table} alt="" style={{ right: 0, bottom: 0, width: "56%", height: "58%", border: "6px solid #FFFFFF" }} />
                {/* eslint-enable @next/next/no-img-element */}
                <div className="d-card-paper d-float" style={{ position: "absolute", left: "6%", bottom: "6%", display: "flex", alignItems: "center", gap: 10 }}>
                  <Faces srcs={[PHOTO.ines]} size={32} />
                  <span style={{ fontSize: 13, lineHeight: 1.35 }}>
                    <b style={{ display: "block" }}>Inês is going</b>
                    <span style={{ color: "#6B7683" }}>Lisbon Village</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {lead ? (
            <section style={{ padding: "0 0 0" }}>
              <div className="d-wrap">
                <p className="d-eyebrow" style={{ marginBottom: 20 }}>Next up</p>
                <Link className="d-feature" href={`/e/${lead.slug}`}>
                  <span className="d-fimg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lead.cover_url ?? PHOTO.table} alt="" />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", padding: 36 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ textAlign: "center", lineHeight: 1.05, border: "1.5px solid #0F1419", borderRadius: 6, padding: "8px 12px" }}>
                        <b style={{ display: "block", fontSize: 26, fontWeight: 800 }}>{dayOf(lead.starts_at).getDate()}</b>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#B8691F", textTransform: "uppercase" }}>
                          {dayOf(lead.starts_at).toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                      </span>
                      <span className="d-body" style={{ fontSize: 14 }}>{where(lead)}</span>
                    </span>
                    <b style={{ display: "block", marginTop: 24, fontSize: 30, fontWeight: 800, letterSpacing: "-.03em" }}>{lead.title}</b>
                    {lead.description ? (
                      <span className="d-body" style={{ display: "block", marginTop: 10, fontSize: 16 }}>{lead.description}</span>
                    ) : null}
                    <span style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 24 }}>
                      <span className="d-status d-open" style={{ fontSize: 13 }}>Open to everyone</span>
                      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "1px solid #C7CDD4", borderRadius: 4, padding: "6px 10px" }}>
                        {priceText(lead, false)}
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
            </section>
          ) : null}

          <section style={{ padding: "72px 0 0" }}>
            <div className="d-wrap">
              <h2 className="d-h2" style={{ marginBottom: 8 }}>{lead ? "Coming up" : "On the calendar"}</h2>
              {later.length === 0 ? (
                <div className="d-rows">
                  <div className="d-row">
                    <p className="d-body">
                      {lead ? "Nothing else on the calendar yet." : "Nothing open to everyone on the calendar yet. Most gatherings are for members."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="d-rows">
                  {later.map((e) => {
                    const d = dayOf(e.starts_at);
                    return (
                      <Link className="d-row d-erow" key={e.id} href={`/e/${e.slug}`}>
                        <span className="d-d">
                          <b>{d.getDate()}</b>
                          <span>{d.toLocaleDateString("en-GB", { month: "short", weekday: "short" })}</span>
                        </span>
                        <span className="d-th">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={e.cover_url ?? PHOTO.members} alt="" />
                        </span>
                        <span>
                          <b style={{ display: "block", fontSize: 19 }}>{e.title}</b>
                          <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 14 }}>{where(e)}</span>
                        </span>
                        <span className="d-act" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                          <span className="d-status d-open" style={{ fontSize: 12 }}>Open to everyone</span>
                          <span className="d-btn d-btn-sm d-btn-dark d-shine">{priceText(e, false) === "Free" ? "Register" : priceText(e, false)}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section style={{ padding: "96px 0 104px" }}>
            <div className="d-wrap d-notify">
              <div className="d-inkbox">
                <span style={{ display: "block", marginBottom: 22 }}>
                  <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.nadia]} size={44} />
                </span>
                <h2 className="d-h2 d-light">Most events are for members.</h2>
                <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: "#B9C3CD" }}>
                  Every Village holds at least one gathering a month, and members can visit the others.
                </p>
                <div style={{ marginTop: "auto", paddingTop: 28 }}>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">Request your invitation <Arrow /></Link>
                </div>
              </div>
              <div className="d-boxed d-form">
                <h2 className="d-h2">Hear about the open ones.</h2>
                <p className="d-body" style={{ marginTop: 12, fontSize: 16 }}>
                  Some gatherings are open to anybody. We will write when one is
                  near you, and not otherwise.
                </p>
                <div style={{ marginTop: 22 }}>
                  <SubscribeForm source="events" />
                </div>
              </div>
            </div>
          </section>
        </div>
        </PageBlocks>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/events" active="/events">
      <PageBlocks data={{ events: events ?? [] }} slug="events">
      {member ? (
        <PageHead
          title="Events"
          sub="Gatherings in your Village, in other Villages and online."
        />
      ) : (
        <section className="pubsec hero-center">
          <h1>{t("title", "Events")}</h1>
          <p className="intro">
            {t("intro", "Gatherings in every Village and online. Some are open to everyone; most are for members.")}
          </p>
        </section>
      )}

      <section className={member ? "sec" : "pubsec"} style={{ paddingTop: 0 }}>
        {member ? (
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/events?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
            <h3>Nothing on the calendar yet</h3>
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
              When your Village or another one plans a gathering, it appears here.
            </p>
          </div>
        ) : (
          <div className="m-events">
            {rows.map((event, i) => {
              const blocked = member ? registrationBlock(event, member) : null;
              const d = new Date(event.starts_at);
              const visiting = Boolean(
                member && event.village_id && event.village_id !== member.village_id
              );
              const status = registeredFor.has(event.id) ? (
                <span className="m-kind m-offer">You are going</span>
              ) : blocked ? (
                <span className="m-kind" style={{ color: "#8A4F14" }}>{blocked}</span>
              ) : (
                <span className="m-kind m-muted">
                  {priceText(event, member ? isPaid(member) : false)}
                </span>
              );
              const where = `${event.village_id ? `${villageName(event.village_id)}. ` : ""}${whenText(event)}${
                event.is_online ? ", online" : event.venue ? `, ${event.venue}` : ""
              }`;
              return (
                <Link
                  key={event.id}
                  className={`m-evcard ${i === 0 ? "m-evlead" : ""}`}
                  href={member ? `/events/${event.slug}` : `/e/${event.slug}`}
                >
                  <span className="m-evimg">
                    {event.cover_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={event.cover_url} alt="" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/brand/table.jpg" alt="" />
                    )}
                    <span className={`m-date ${visiting ? "visit" : ""}`}>
                      <b>{d.getDate()}</b>
                      <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                    </span>
                  </span>
                  <span className="m-evbody">
                    {visiting ? <span className="m-kind m-event">Another Village</span> : event.is_online ? <span className="m-kind m-event">Online</span> : null}
                    <b>{event.title}</b>
                    <span className="m-muted">{where}</span>
                    {status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {member ? null : (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="band">
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 22 }}>Most events are for members</h2>
              <p style={{ marginTop: 8 }}>
                Every Village holds at least one gathering a month, and members
                can visit the others.
              </p>
            </div>
            <Link className="btn btn-mint" href="/apply">
              Request your invitation
            </Link>
          </div>

          <div className="panel panel-wash" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>Hear about the open ones</h3>
            <p className="muted small" style={{ margin: "6px 0 12px" }}>
              Some gatherings are open to anybody. We will write when one is
              near you, and not otherwise.
            </p>
            <SubscribeForm source="events" />
          </div>
        </section>
      )}
          </PageBlocks>
</DualPage>
  );
}