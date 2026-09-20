import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Membership, ExpatPreneurs Global",
  description:
    "Membership is by invitation and costs nothing. The paid plan opens the rest of the network.",
};

function priceLine(plan: {
  price_cents: number;
  currency: string;
  interval: string;
}) {
  if (plan.interval === "none" || plan.price_cents === 0) return "Free";
  const amount = (plan.price_cents / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  });
  return `${amount} a ${plan.interval}`;
}

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, slug, name, blurb, price_cents, currency, interval, features")
    .eq("active", true)
    .order("position");

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Membership</h1>
          <p className="lead">
            Membership is by invitation and costs nothing. One paid plan opens
            the rest of the network to you.
          </p>
        </section>

        <section className="band">
          <div className="two">
            {(plans ?? []).map((plan, i) => (
              <div className={`panel ${i === 0 ? "" : "wash"}`} key={plan.id}>
                <h3>{plan.name}</h3>
                <p className="lead" style={{ marginTop: 6 }}>
                  {priceLine(plan)}
                </p>
                <p className="muted small">{plan.blurb}</p>
                <ul>
                  {(plan.features ?? []).map((feature: string) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.slug === "member" ? (
                  <p style={{ marginTop: 14 }}>
                    <Link className="btn primary" href="/apply">
                      Request an invitation
                    </Link>
                  </p>
                ) : (
                  <p className="muted small" style={{ marginTop: 14 }}>
                    Members take this when their business starts needing the
                    other cities. You can change or cancel it yourself at any
                    time.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <h2>How people get in</h2>
          <div className="two">
            <div className="panel">
              <h3>Somebody reads every request</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                A request goes to the Local Admins of the city you named. They
                read it, and the Global team makes the final decision. It takes
                days rather than minutes, and you hear either way.
              </p>
            </div>
            <div className="panel">
              <h3>Why it is not open</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                A Circle is fifty people who are meant to know each other. That
                only works if somebody is deciding who joins, and if the mix of
                nationalities in a Village stays wide.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <h2>What it is not</h2>
          <div className="two">
            <div className="panel">
              <h3>Not a lead list</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Members do not pitch each other. What happens instead is
                introductions, which is slower and works better.
              </p>
            </div>
            <div className="panel">
              <h3>Not a feed</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                There is nothing here to scroll. People ask for what they need,
                somebody answers, and most of it ends up happening in person.
              </p>
            </div>
          </div>
        </section>

        <section className="band cta">
          <h2>If that sounds like you</h2>
          <p className="lead">
            Tell us where you are and what you are building. It takes ten
            minutes.
          </p>
          <p>
            <Link className="btn primary" href="/apply">
              Request an invitation
            </Link>{" "}
            <Link className="btn" href="/discover">
              Look around first
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}