import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { type Plan } from "@/components/plans";
import { MembershipPlans } from "@/components/design/membership-plans";
import { Faces, Pm, Tick, PHOTO } from "@/components/design/parts";
import { type Pricing } from "@/lib/pricing";

export const metadata = {
  title: "Membership, ExpatPreneurs Global",
  description:
    "Membership is by invitation. Village Membership is priced in the currency of your own Village.",
};

const QUESTIONS: [string, string][] = [
  ["Why is membership by invitation?", "So every Village stays trusted and useful. Every request is read personally."],
  ["Does membership cost anything?", "Village Membership is priced in the currency of your own Village, at the founding rate while founding places last there."],
  ["I am already in the Dubai WhatsApp group. Do I pay?", "Yes. Re-enrolling keeps your place in the group, and Village Membership is what opens the platform itself. Re-enrol first and you keep the founding rate while founding places last."],
  ["Who can request an invitation?", "Anyone building a business in a country that is not their country of origin, from the idea stage to expansion."],
  ["Why do you ask about my nationalities and the countries I have lived in?", "They make up your expat journey on your profile, so members can find people who know a market or speak a language."],
  ["Is ExpatPreneurs a place to sell?", "Members share their work in the right places, but relationships come first. Mass pitching is not allowed."],
  ["What if I move to another city?", "Your profile and history stay with you. You can ask to transfer to the Village in your new city."],
  ["Is this a dating space?", "No. It is a professional community built on warm, respectful connection."],
  ["Can I change membership later?", "Yes. Both are on the Village Membership page, and cancelling runs to the end of the period you have paid for."],
];

const EXPECTED = [
  "Human before transaction",
  "Collaboration over competition",
  "Contribute as well as receive",
  "Respect professional boundaries",
  "Help keep the Village international",
];

export default async function MembershipPage() {
  const supabase = await createClient();
  const [{ data: plans }, { data: pricing }] = await Promise.all([
    supabase
      .from("plans")
      .select(
        "id, slug, name, badge, tagline, blurb, price_cents, currency, interval, features, not_included"
      )
      .eq("active", true)
      .order("position"),
    // Each Village bills in its own currency, so the card shows a
    // starting price rather than one figure for the whole network.
    supabase
      .from("village_pricing")
      .select(
        "village_slug, village_name, currency, month_cents, year_cents, founding_month_cents, founding_year_cents, founding_open, founding_seats"
      )
      .eq("plan_slug", "paid"),
  ]);
  const rates = (pricing ?? []) as (Pricing & { founding_seats?: number })[];

  // A published page replaces what is written below.
  const page = await livePage("membership");

  if (page) {
    return (
      <PublicPage active="/membership">
        <Blocks blocks={page.blocks} data={{ plans: plans ?? [], pricing: rates }} />
      </PublicPage>
    );
  }

  const seatCounts = new Set(rates.map((r) => r.founding_seats ?? 50));
  const seats = seatCounts.size === 1 ? [...seatCounts][0] : null;

  return (
    <PublicPage active="/membership">
      <div className="d-page">
        <section style={{ padding: "64px 0 48px" }}>
          <div className="d-wrap d-hero d-hero-end">
            <div>
              <p className="d-eyebrow">Membership</p>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "17ch" }}>Your people. Your opportunities. Your village.</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "54ch" }}>
                ExpatPreneurs is for anyone building a business in a country that is
                not their country of origin, at any stage: an idea, a growing
                business or an expansion. Membership is by invitation, for people who
                want to contribute as well as receive.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
              <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.julien, PHOTO.nadia, PHOTO.kristiane]} size={52} />
              <p className="d-body" style={{ maxWidth: "36ch" }}>
                Every request is read personally, by people in the Village you are asking to join.
              </p>
            </div>
          </div>
        </section>

        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <MembershipPlans plans={(plans ?? []) as Plan[]} pricing={rates} seats={seats} />
            <p className="d-small" style={{ marginTop: 22 }}>
              Membership is by invitation, and it begins when it is paid for.
              Once your request is accepted you finish your profile and then
              Village Membership opens the rest.
            </p>
          </div>
        </section>

        <section className="d-sec d-washed" style={{ padding: "96px 0" }}>
          <div className="d-wrap">
            <div className="d-head" style={{ marginBottom: 40 }}>
              <h2 className="d-h2" style={{ maxWidth: "22ch" }}>What a Village Member&apos;s month can look like.</h2>
              <Link className="d-ulink" href="/how-it-works">How it works</Link>
            </div>
            <div className="d-month">
              <figure>
                <span className="d-shine d-zoom" style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PHOTO.table} alt="The table at a founders dinner" style={{ width: "100%", height: 220, objectFit: "cover" }} />
                </span>
                <figcaption style={{ marginTop: 14 }}>
                  <b style={{ display: "block", fontSize: 17 }}>A seat at the table</b>
                  <span className="d-body" style={{ display: "block", marginTop: 4 }}>The monthly gathering in your Village, and preferential pricing on paid events.</span>
                </figcaption>
              </figure>
              <figure>
                <span style={{ display: "block", borderRadius: 6, background: "#FFFFFF", border: "1px solid #0F1419", height: 220, padding: 20 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Faces srcs={[PHOTO.tomas]} size={36} />
                    <span style={{ fontSize: 13, lineHeight: 1.35 }}><b style={{ display: "block" }}>Tomás, Dubai</b><span style={{ color: "#6B7683" }}>wants to connect</span></span>
                  </span>
                  <span style={{ display: "block", marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>&ldquo;I design brands for hotels and I am exploring Lisbon. Open to a short call?&rdquo;</span>
                  <span style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <span style={{ background: "#0F1419", color: "#FFFFFF", borderRadius: 6, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>Accept</span>
                    <span style={{ border: "1px solid #C7CDD4", borderRadius: 6, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>Later</span>
                  </span>
                </span>
                <figcaption style={{ marginTop: 14 }}>
                  <b style={{ display: "block", fontSize: 17 }}>People in every Village</b>
                  <span className="d-body" style={{ display: "block", marginTop: 4 }}>The global directory and connection requests across the network.</span>
                </figcaption>
              </figure>
              <figure>
                <span className="d-shine d-zoom" style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PHOTO.members} alt="Members working together" style={{ width: "100%", height: 220, objectFit: "cover" }} />
                </span>
                <figcaption style={{ marginTop: 14 }}>
                  <b style={{ display: "block", fontSize: 17 }}>Your Circle, Hub and Pod</b>
                  <span className="d-body" style={{ display: "block", marginTop: 4 }}>Member-only groups where referrals and collaborations start.</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="d-sec">
          <div className="d-wrap d-faq">
            <div>
              <h2 className="d-h2">Questions</h2>
              <div style={{ marginTop: 24 }}>
                {QUESTIONS.map(([q, a], i) => (
                  <details key={q} open={i === 0}>
                    <summary>{q}<Pm /></summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
            <aside className="d-dark" style={{ borderRadius: 6, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.kristiane} alt="Kristiane Charrier, founder of ExpatPreneurs" style={{ width: "100%", height: 260, objectFit: "cover", objectPosition: "center 18%" }} />
              <div style={{ padding: 32 }}>
                <h3 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>What we expect from members</h3>
                <ul className="d-values" style={{ marginTop: 18 }}>
                  {EXPECTED.map((x) => (
                    <li key={x}>
                      <span style={{ width: 18, height: 18, display: "inline-flex" }}><Tick color="#A8DCD1" /></span>
                      {x}
                    </li>
                  ))}
                </ul>
                <Link className="d-ulink-light" href="/legal/terms" style={{ display: "inline-block", marginTop: 24 }}>Read our terms</Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}
