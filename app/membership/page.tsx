import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { Plans, type Plan } from "@/components/plans";
import { type Pricing } from "@/lib/pricing";
import { Ic } from "@/components/icon";

export const metadata = {
  title: "Membership, ExpatPreneurs Global",
  description:
    "Explorer membership is by invitation and costs nothing. Village Membership opens the rest of the network.",
};

const QUESTIONS: [string, string][] = [
  ["Why is membership by invitation?", "So every Village stays trusted and useful. Every request is read personally."],
  ["Does membership cost anything?", "Membership in your own Village comes with your invitation and costs nothing. There is one paid tier, Village Membership, which adds every Village. It is priced in the currency of your own Village, at the founding rate while founding places last there."],
  ["I am already in the Dubai WhatsApp group. Do I pay?", "No. Re-enrol on the platform and your place stays, with a founding member badge. Village Membership is optional, for reaching every Village."],
  ["Who can request an invitation?", "Anyone building a business in a country that is not their country of origin, from the idea stage to expansion."],
  ["Why do you ask about my nationalities and the countries I have lived in?", "They make up your expat journey on your profile, so members can find people who know a market or speak a language."],
  ["Is ExpatPreneurs a place to sell?", "Members share their work in the right places, but relationships come first. Mass pitching is not allowed."],
  ["What if I move to another city?", "Your profile and history stay with you. You can ask to transfer to the Village in your new city."],
  ["Is this a dating space?", "No. It is a professional community built on warm, respectful connection."],
  ["Can I change membership later?", "Yes. You can upgrade or cancel from your settings at any time."],
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
        "village_slug, village_name, currency, month_cents, year_cents, founding_month_cents, founding_year_cents, founding_open"
      )
      .eq("plan_slug", "paid"),
  ]);
  const rates = (pricing ?? []) as Pricing[];

  // A published page replaces what is written below.
  const page = await livePage("membership");

  if (page) {
    return (
      <PublicPage active="/membership">
        <Blocks blocks={page.blocks} data={{ plans: plans ?? [], pricing: rates }} />
      </PublicPage>
    );
  }

  return (
    <PublicPage active="/membership">
      <section className="pubsec memsec">
        <h2>Membership</h2>
        <p className="intro">
          ExpatPreneurs is for anyone building a business in a country that is
          not their country of origin, at any stage: an idea, a growing
          business or an expansion. Membership is by invitation, for people who
          want to contribute as well as receive.
        </p>
        <Plans plans={(plans ?? []) as Plan[]} pricing={rates} />
        <p className="muted small plans-note">
          Membership is by invitation. Once your request is accepted you can
          upgrade to Village Membership at any time.
        </p>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="gside">
          <div className="faqcol">
            <h2 style={{ fontSize: 22 }}>Questions</h2>
            <div className="faq" style={{ marginTop: 10 }}>
              {QUESTIONS.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="panel panel-wash">
            <h3 style={{ fontSize: 15 }}>What we expect from members</h3>
            <ul className="ticks" style={{ marginTop: 10 }}>
              {EXPECTED.map((x) => (
                <li key={x}>
                  <Ic name="check" />
                  {x}
                </li>
              ))}
            </ul>
            <Link className="btn btn-ghost btn-sm" href="/legal/terms">
              Read our terms
            </Link>
          </aside>
        </div>
      </section>
    </PublicPage>
  );
}