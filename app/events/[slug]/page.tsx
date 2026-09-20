import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import {
  whenText,
  priceText,
  audienceText,
  registrationBlock,
  type EventRow,
} from "@/lib/events";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm, CancelForm } from "../forms";
import { PhotoForm, RemovePhoto } from "@/app/photos/forms";
import { TicketButton } from "@/app/upgrade/forms";
import { stripeReady } from "@/lib/stripe";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/events");
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const event = data as EventRow;

  const [{ data: host }, { data: village }, { data: mine }, { data: guests }] =
    await Promise.all([
      event.host_id
        ? supabase
            .from("profiles")
            .select("id, full_name, headline")
            .eq("id", event.host_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      event.village_id
        ? supabase
            .from("villages")
            .select("name")
            .eq("id", event.village_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("profile_id", member.id)
        .maybeSingle(),
      supabase
        .from("event_registrations")
        .select("profile_id, status")
        .eq("event_id", event.id)
        .eq("status", "confirmed")
        .limit(60),
    ]);

  const guestIds = (guests ?? [])
    .map((g) => g.profile_id)
    .filter(Boolean) as string[];
  const { data: guestProfiles } = event.show_guest_list && guestIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", guestIds)
        .limit(30)
    : { data: [] };

  const { data: photos } = await supabase
    .from("event_photos")
    .select("id, url, caption, uploader_id")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(24);

  const isOver = new Date(event.starts_at).getTime() < Date.now();
  const blocked = registrationBlock(event, member);
  const registered = mine && mine.status !== "cancelled";
  const visiting =
    event.village_id !== null && event.village_id !== member.village_id;
  const taken = (guests ?? []).length;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/events">Events</Link>
          </p>
          <p>
            {village?.name ? (
              <span className={`chip ${visiting ? "blue" : "mint"}`}>
                {village.name}
              </span>
            ) : (
              <span className="chip">Every Village</span>
            )}{" "}
            {event.visibility === "public" ? (
              <span className="chip">Open to everyone</span>
            ) : null}
          </p>
          <h1>{event.title}</h1>
          <p className="lead">{whenText(event)}</p>
          {event.cover_url ? (
            <div className="shot" style={{ maxWidth: 720 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.cover_url} alt="" />
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {event.description}
                </p>
              </div>

              <div className="panel">
                <h3>The detail</h3>
                <dl className="kv">
                  <dt>When</dt>
                  <dd>{whenText(event)}</dd>
                  <dt>Where</dt>
                  <dd>
                    {event.is_online
                      ? "Online. The link is sent after you register."
                      : `${event.venue ?? "To be confirmed"}. The full address is sent after you register.`}
                  </dd>
                  <dt>Host</dt>
                  <dd>
                    {host ? (
                      <Link href={`/members/${host.id}`}>{host.full_name}</Link>
                    ) : (
                      "The Local Admins"
                    )}
                  </dd>
                  <dt>Who can register</dt>
                  <dd>
                    {audienceText(event, village?.name ?? null)}
                    {event.requires_approval
                      ? ". The host approves each registration."
                      : ""}
                  </dd>
                  <dt>Price</dt>
                  <dd>{priceText(event)}</dd>
                  <dt>Places</dt>
                  <dd>
                    {taken} of {event.capacity} taken
                    {event.visitor_places
                      ? `. ${event.visitor_places} kept for visiting members.`
                      : ""}
                  </dd>
                </dl>
              </div>

              {isOver || (photos ?? []).length ? (
                <div className="panel">
                  <h3>Photographs</h3>
                  {(photos ?? []).length === 0 ? (
                    <p className="muted small" style={{ marginTop: 6 }}>
                      None yet. If you were there, put one up.
                    </p>
                  ) : (
                    <div className="grid three" style={{ marginTop: 12 }}>
                      {(photos ?? []).map((photo) => (
                        <div key={photo.id}>
                          <div className="shot">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={photo.caption ?? ""} />
                          </div>
                          {photo.caption ? (
                            <p className="muted small">{photo.caption}</p>
                          ) : null}
                          {photo.uploader_id === member.id ? (
                            <RemovePhoto photoId={photo.id} slug={event.slug} />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {registered ? (
                    <div style={{ marginTop: 16 }}>
                      <PhotoForm eventId={event.id} slug={event.slug} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="panel">
                <h3>Going</h3>
                {event.show_guest_list ? (
                  (guestProfiles ?? []).length === 0 ? (
                    <p className="muted small" style={{ marginTop: 8 }}>
                      Nobody yet. Be the first.
                    </p>
                  ) : (
                    <div className="rows" style={{ marginTop: 12 }}>
                      {(guestProfiles ?? []).map((person) => (
                        <Link
                          className="rowlink"
                          key={person.id}
                          href={`/members/${person.id}`}
                        >
                          <div>
                            <b>{person.full_name}</b>
                            <div className="muted small">{person.headline}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    The host keeps the guest list private for this event.{" "}
                    {taken} people are registered.
                  </p>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                {registered ? (
                  <>
                    <p>
                      <span className="chip mint">
                        {mine?.status === "pending"
                          ? "Waiting for the host"
                          : "You are registered"}
                      </span>
                    </p>
                    <p className="muted small">
                      A reminder comes the day before and an hour before it
                      starts.
                    </p>
                    <p>
                      <a className="btn" href={`/events/${event.slug}/calendar`}>
                        Add to calendar
                      </a>
                    </p>
                    <CancelForm eventId={event.id} slug={event.slug} />
                  </>
                ) : blocked ? (
                  <>
                    <h3>{blocked}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      You can still see what is on. The paid plan opens every
                      Village, including their events.
                    </p>
                    <Link className="btn" href="/upgrade">
                      See the paid plan
                    </Link>
                  </>
                ) : taken >= event.capacity ? (
                  <>
                    <h3>This one is full</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Ask the host to put you on the waiting list.
                    </p>
                  </>
                ) : event.price_cents && stripeReady ? (
                  <>
                    <h3>{priceText(event)}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      A ticket confirms your place. Paying is what registers
                      you.
                    </p>
                    <TicketButton
                      eventId={event.id}
                      slug={event.slug}
                      label="Get a ticket"
                    />
                  </>
                ) : event.price_cents ? (
                  <>
                    <h3>{priceText(event)}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Tickets are not being taken online yet. Register here and
                      the host will sort the payment with you.
                    </p>
                    <RegisterForm
                      eventId={event.id}
                      slug={event.slug}
                      requiresApproval={event.requires_approval}
                      isVisitor={visiting}
                      label={visiting ? "Register as a visitor" : "Register"}
                    />
                  </>
                ) : (
                  <RegisterForm
                    eventId={event.id}
                    slug={event.slug}
                    requiresApproval={event.requires_approval}
                    isVisitor={visiting}
                    label={visiting ? "Register as a visitor" : "Register"}
                  />
                )}
              </div>

              {visiting ? (
                <div className="panel wash">
                  <h3>Visiting {village?.name}</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    The Local Admins will see you are coming and can introduce
                    you to members.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}