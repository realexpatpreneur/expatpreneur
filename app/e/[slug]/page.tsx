import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whenText, priceText, type EventRow } from "@/lib/events";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GuestRegisterForm } from "@/app/events/forms";

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

  const { data } = await supabase
    .from("events")
    .select("*")
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
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <p>
            {village?.name ? (
              <span className="chip mint">{village.name}</span>
            ) : null}{" "}
            <span className="chip">Open to everyone</span>
          </p>
          <h1>{event.title}</h1>
          <p className="lead">{whenText(event)}</p>
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
                      : `${event.venue ?? "To be confirmed"}, ${village?.city ?? ""}`}
                  </dd>
                  <dt>Price</dt>
                  <dd>{priceText(event)}</dd>
                </dl>
              </div>
            </div>

            <div className="stack">
              {registered ? (
                <div className="panel">
                  <h3>You are registered</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {event.requires_approval
                      ? "The host reviews each registration and will be in touch."
                      : "The details are on their way to your inbox."}
                  </p>
                </div>
              ) : (
                <GuestRegisterForm
                  eventId={event.id}
                  slug={event.slug}
                  requiresApproval={event.requires_approval}
                />
              )}

              <div className="panel wash">
                <h3>About ExpatPreneurs</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  A curated network of expat entrepreneurs. Most of what we do
                  is for members, but some events are open to anyone.
                </p>
                <Link className="btn" href="/apply">
                  Request an invitation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}