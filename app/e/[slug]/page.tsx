import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whenText, priceText, EVENT_COLUMNS, type EventRow } from "@/lib/events";
import { PublicPage } from "@/components/public-page";
import { GuestRegisterForm } from "@/app/events/forms";

// The three lines of the detail, ruled rather than boxed.
const DT = { fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7683" } as const;
const ROW = {
  display: "grid",
  gridTemplateColumns: "120px minmax(0,1fr)",
  gap: 16,
  padding: "18px 0",
  borderBottom: "1px solid #E3E6EA",
} as const;

// The public face of an event. Anyone can open this, whether they have an
// account or not, as long as the host made the event public.
export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { slug } = await params;
  const { registered } = await searchParams;
  const supabase = await createClient();

  // Same as /events: a star on events is a permission error since 0074,
  // so every public event link has been answering not found.
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .eq("visibility", "public")
    .eq("status", "published")
    .maybeSingle();

  if (!data) notFound();
  const event = data as EventRow;

  const { data: village } = event.village_id
    ? await supabase
        .from("villages")
        .select("name, city")
        .eq("id", event.village_id)
        .maybeSingle()
    : { data: null };

  return (
    <PublicPage>
      <main className="d-page">
        {/* The hero. For somebody who has never heard of us, this is the
            whole of the company they see. */}
        <section style={{ padding: "48px 0 72px" }}>
          <div className={event.cover_url ? "d-wrap d-hero" : "d-wrap"}>
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
                {village?.name ? (
                  <p className="d-eyebrow">{village.name}</p>
                ) : null}
                <span className="d-status d-open" style={{ fontSize: 13 }}>Open to everyone</span>
              </div>
              <h1 className="d-h1" style={{ marginTop: 18, maxWidth: "20ch" }}>{event.title}</h1>
              <p className="d-lead" style={{ marginTop: 18, fontSize: 20, maxWidth: "38ch" }}>{whenText(event)}</p>
              <p className="d-body" style={{ marginTop: 10, fontSize: 16, maxWidth: "38ch" }}>
                {event.is_online
                  ? "Online. The link is sent after you register."
                  : `${event.venue ?? "To be confirmed"}, ${village?.city ?? ""}`}
              </p>
            </div>
            {event.cover_url ? (
              <figure className="d-shine" style={{ borderRadius: 6, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.cover_url} alt="" style={{ width: "100%", height: 440, objectFit: "cover" }} />
              </figure>
            ) : null}
          </div>
        </section>

        <section className="d-sec d-sec-top0" style={{ paddingBottom: 104 }}>
          {/* Two columns of equal width, so the registration form is as
              wide as what it is asking you to register for. */}
          <div className="d-wrap d-notify" style={{ gap: 56 }}>
            <div>
              <p className="d-lead" style={{ whiteSpace: "pre-wrap", fontSize: 17, maxWidth: "66ch" }}>
                {event.description}
              </p>

              <h3 style={{ marginTop: 56, fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>The detail</h3>
              <dl style={{ marginTop: 20, borderTop: "2px solid #0F1419", maxWidth: 620 }}>
                <div style={ROW}>
                  <dt style={DT}>When</dt>
                  <dd className="d-body" style={{ margin: 0, color: "#0F1419" }}>{whenText(event)}</dd>
                </div>
                <div style={ROW}>
                  <dt style={DT}>Where</dt>
                  <dd className="d-body" style={{ margin: 0, color: "#0F1419" }}>
                    {event.is_online
                      ? "Online. The link is sent after you register."
                      : `${event.venue ?? "To be confirmed"}, ${village?.city ?? ""}`}
                  </dd>
                </div>
                <div style={ROW}>
                  <dt style={DT}>Price</dt>
                  <dd className="d-body" style={{ margin: 0, color: "#0F1419" }}>{priceText(event)}</dd>
                </div>
              </dl>
            </div>

            <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
              {registered ? (
                <div className="d-boxed">
                  <h3 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>You are registered</h3>
                  <p className="d-body" style={{ marginTop: 10, fontSize: 16 }}>
                    {event.requires_approval
                      ? "The host reviews each registration and will be in touch."
                      : "The details are on their way to your inbox."}
                  </p>
                </div>
              ) : (
                <div className="d-boxed d-form">
                  <GuestRegisterForm
                    eventId={event.id}
                    slug={event.slug}
                    requiresApproval={event.requires_approval}
                    priced={Boolean(event.price_cents)}
                  />
                </div>
              )}

              <div className="d-inkbox" style={{ padding: 32 }}>
                <h3 className="d-h2 d-light" style={{ fontSize: 24 }}>About ExpatPreneurs</h3>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: "#B9C3CD" }}>
                  A curated network of expat entrepreneurs. Most of what we do
                  is for members, but some events are open to anyone.
                </p>
                <div style={{ marginTop: 24 }}>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">
                    Request an invitation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
