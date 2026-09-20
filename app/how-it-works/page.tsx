import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { PublicPage } from "@/components/public-page";
import { Ic } from "@/components/icon";

export const metadata = { title: "How it works, ExpatPreneurs Global" };

// layerBlock: Global holds the Village, the Village holds the Circle.
const LAYERS: [string, string, string, string][] = [
  ["globe", "Global", "Reach", "The whole network. Reach members, events and markets wherever there is a Village."],
  ["pin", "Village", "Home", "Your city. Local gatherings, local knowledge and the people building around you."],
  ["rings", "Circle", "Belonging", "Your home base of up to 50 members, where real relationships form."],
];

function NestHead({ layer }: { layer: [string, string, string, string] }) {
  const [icon, title, word, text] = layer;
  return (
    <div className="nest-head">
      <span className="nest-ic">
        <Ic name={icon} />
      </span>
      <div>
        <span className="nest-word">{word}</span>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

const JOURNEY: [string, string][] = [
  ["Request an invitation", "Tell us about you, your business and your expat journey."],
  ["Review", "Every request is read personally."],
  ["Welcome", "Once accepted, complete your profile and choose what the public can see."],
  ["Join your Circle", "You are placed in a Circle and added to its WhatsApp group."],
  ["Take part", "Ask, offer, meet and explore other Villages."],
  ["Move with you", "If you change city, your profile and history come with you."],
];

export default async function HowItWorksPage() {
  // A published page replaces what is written below.
  const page = await livePage("how");

  if (page) {
    return (
      <PublicPage active="/how-it-works">
        <Blocks blocks={page.blocks} />
      </PublicPage>
    );
  }

  return (
    <PublicPage active="/how-it-works">
      <section className="pubsec">
        <h2>How ExpatPreneurs works</h2>
        <p className="intro">
          Local community gives you belonging. The global network gives you
          continuity, reach and access. You get both.
        </p>

        <div
          className="nest nest-1"
          role="group"
          aria-label="Global contains Village, which contains Circle"
        >
          <NestHead layer={LAYERS[0]} />
          <div className="nest nest-2">
            <NestHead layer={LAYERS[1]} />
            <div className="nest nest-3">
              <NestHead layer={LAYERS[2]} />
            </div>
          </div>
        </div>

        <div className="g2" style={{ marginTop: 18 }}>
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Industry Groups</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Stable groups by profession, such as Creative &amp; Design or
              Hospitality. They connect you with people in your field across
              Circles and, over time, across Villages.
            </p>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Pods</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Small groups of about six members working toward a shared goal,
              such as accountability or entering a new market. Pods have a
              lead, a rhythm and an end date.
            </p>
          </div>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 22 }}>Where things happen</h2>
        <div className="g3" style={{ marginTop: 16 }}>
          <div className="panel">
            <Ic name="chat" style={{ color: "#24675A" }} />
            <h3 style={{ fontSize: 14, marginTop: 10 }}>
              Daily conversation on WhatsApp
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Each Circle, Industry Group and Pod has its own private WhatsApp
              group.
            </p>
          </div>
          <div className="panel">
            <Ic name="grid" style={{ color: "var(--blue)" }} />
            <h3 style={{ fontSize: 14, marginTop: 10 }}>
              Everything else on the platform
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Your profile, the Directory, Ask &amp; Offer, events, businesses
              and learning.
            </p>
          </div>
          <div className="panel">
            <Ic name="cal" style={{ color: "#8A4F14" }} />
            <h3 style={{ fontSize: 14, marginTop: 10 }}>
              In person every month
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Each Village holds at least one meaningful gathering a month.
            </p>
          </div>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 22 }}>From invitation to your Circle</h2>
        <ol className="jpath" aria-label="From invitation to your Circle">
          {JOURNEY.map(([title, text], n) => (
            <li
              className="jp-step"
              key={title}
              style={{ "--i": n } as React.CSSProperties}
            >
              <span className="jp-num">{n + 1}</span>
              <div className="jp-body">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="row" style={{ marginTop: 22, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/apply">
            Request your invitation
          </Link>
          <Link className="btn btn-ghost" href="/membership">
            See membership
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}