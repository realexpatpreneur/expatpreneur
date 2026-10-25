import Link from "next/link";

// The 2026 home page, as approved on the design canvas.
// Every class here is prefixed h26- so nothing else on the site is touched.

export type HomeVillage = {
  slug: string;
  name: string;
  country: string | null;
  status: string;
  summary: string | null;
  members: number;
  circles: number;
};

const STATUS: Record<string, string> = {
  open: "Open",
  launching: "Launching",
  exploring: "Being explored",
};

function villageLine(v: HomeVillage) {
  if (v.summary) return v.summary;
  if (v.status === "open")
    return `${v.members} members across ${v.circles} ${v.circles === 1 ? "Circle" : "Circles"}, meeting monthly.`;
  if (v.members) return `${v.members} founding members, the first Circle forming now.`;
  return "Local Admins being prepared ahead of the first gathering.";
}

export function HomeDesign({ villages }: { villages: HomeVillage[] }) {
  const open = villages.filter((v) => v.status !== "exploring").length;

  return (
    <div className="h26">
      {/* 1. the hero */}
      <section className="h26-hero">
        <div className="h26-wrap h26-hero-in">
          <span className="h26-badge">Dubai is open. Lisbon and Paris are next.</span>
          <h1 className="h26-h1">Your business needs a village too.</h1>
          <p className="h26-lead">
            A curated network of expat entrepreneurs. Belong to a small, trusted
            community in your city, and reach people you can trust in other markets.
          </p>
          <div className="h26-ctas">
            <Link className="h26-btn" href="/apply">Request your invitation</Link>
            <Link className="h26-btn h26-btn-ghost" href="/villages">Find your Village</Link>
          </div>
          <p className="h26-note">
            Founders from more than twenty five countries, meeting every month in their own city.
          </p>
        </div>
      </section>

      {/* 2. the three levels */}
      <section className="h26-band">
        <div className="h26-wrap">
          <p className="h26-eyebrow">How it is built</p>
          <h2 className="h26-h2">Big enough to open doors. Small enough to know each other.</h2>
          <p className="h26-intro">
            Every member belongs to three places at once. As the network grows, your
            home base stays human sized.
          </p>
          <div className="h26-shot">
            <div className="h26-shot-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/members.jpg" alt="Members of one Village working through something together" />
            </div>
            <div className="h26-levels">
              {([
                ["globe", "Global", "The whole network. Reach members, events and markets wherever there is a Village."],
                ["village", "Village", "Your city. Local gatherings, local knowledge and the people building around you."],
                ["circle", "Circle", "Your home base of up to fifty members, where real relationships form."],
              ] as const).map(([file, name, text], i) => (
                <div className="h26-level" key={name} style={{ animationDelay: `${i * 110}ms` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h26-ic" src={`/brand/${file}.png`} alt="" width={168} height={168} />
                  <p className="h26-level-name">{name}</p>
                  <p className="h26-level-text">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. the founder, with the figures */}
      <section className="h26-wrap h26-sec">
        <div className="h26-founder">
          <div className="h26-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/founder.jpg" alt="Kristiane Charrier" />
            <Link className="h26-btn h26-btn-white" href="/media">Read the story</Link>
          </div>
          <div className="h26-founder-side">
            <p className="h26-eyebrow">Who are we?</p>
            <h2 className="h26-h2 h26-h2-sm">
              Six countries, one lesson: local belonging needs global continuity
            </h2>
            <div className="h26-bento">
              <div className="h26-col">
                <div className="h26-tile h26-tile-num"><b>{open}</b><span className="h26-glyph" /></div>
                <div className="h26-tile h26-tile-lift h26-tile-tall">
                  <p className="h26-tile-head">Villages, with more being explored</p>
                  <p className="h26-tile-foot">Dubai is open. Lisbon and Paris are next.</p>
                </div>
              </div>
              <div className="h26-col">
                <div className="h26-tile h26-tile-lift h26-tile-tall">
                  <p className="h26-tile-head">Members to a Circle, never more</p>
                  <p className="h26-tile-foot">Your home base of up to fifty members, where real relationships form.</p>
                </div>
                <div className="h26-tile h26-tile-num"><b>50</b><span className="h26-glyph" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. by invitation */}
      <section className="h26-wrap h26-sec">
        <div className="h26-invite">
          <span className="h26-invite-mark" aria-hidden="true" />
          <p className="h26-invite-head">ExpatPreneurs is by invitation.</p>
          <div>
            <p className="h26-invite-text">
              Every request is read by a person in the Village you are asking to join.
            </p>
            <Link className="h26-btn" href="/apply">Request your invitation</Link>
          </div>
        </div>
      </section>

      {/* 5. the Villages */}
      <section className="h26-wrap h26-sec">
        <div className="h26-sechead">
          <div>
            <p className="h26-eyebrow">The Villages</p>
            <h2 className="h26-h2 h26-h2-sm">Find yours</h2>
          </div>
          <Link className="h26-link" href="/villages/suggest">Suggest a city</Link>
        </div>
        <div className="h26-rows">
          {villages.map((v) => (
            <Link className="h26-row" key={v.slug} href={`/villages/${v.slug}`}>
              <span className="h26-row-name">
                <b>{v.name}</b>
                <small>{v.country}</small>
              </span>
              <span className="h26-row-line">{villageLine(v)}</span>
              <span className={`h26-chip h26-chip-${v.status}`}>{STATUS[v.status] ?? v.status}</span>
              <span className="h26-row-go">{v.status === "open" ? "Explore" : "See the Village"}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. what members do */}
      <section className="h26-wash">
        <div className="h26-wrap">
          <p className="h26-eyebrow h26-eyebrow-blue">What members do here</p>
          <h2 className="h26-h2 h26-h2-sm h26-h2-tight">
            Ask, offer, and meet the person who has done it before.
          </h2>
          <div className="h26-four">
            {([
              ["Ask and offer", "Post what you need or what you can give, and track it until it is resolved."],
              ["Find the right people", "Search by skill, language and the markets people actually know."],
              ["Meet in person", "Monthly gatherings in your Village, and events in other cities."],
              ["Explore new markets", "Talk to members who already build where you want to go."],
            ] as const).map(([title, text]) => (
              <div key={title}>
                <b>{title}</b>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. the numbers, stacking as you scroll */}
      <section className="h26-wrap h26-sec">
        <div className="h26-numbers">
          <div className="h26-numbers-side">
            <p className="h26-eyebrow h26-eyebrow-blue">[ The network so far ]</p>
            <h2 className="h26-h2 h26-h2-sm">Small by design, and growing city by city</h2>
            <p className="h26-intro">
              Every member belongs to three places at once. As the network grows, your
              home base stays human sized.
            </p>
          </div>
          <div className="h26-stack">
            <div className="h26-card h26-card-1">
              <b>{open}</b>
              <p className="h26-card-head">Villages, with more being explored</p>
              <p className="h26-card-text">Dubai is open. Lisbon and Paris are next, with more cities being explored.</p>
            </div>
            <div className="h26-card h26-card-2">
              <b>50</b>
              <p className="h26-card-head">Members to a Circle, never more</p>
              <p className="h26-card-text">Your home base of up to fifty members, where real relationships form.</p>
            </div>
            <div className="h26-card h26-card-3">
              <b>25+</b>
              <p className="h26-card-head">Countries of origin in Dubai alone</p>
              <p className="h26-card-text">Founders from more than twenty five countries, meeting every month in their own city.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. the close */}
      <section className="h26-close">
        <div className="h26-wrap">
          <p className="h26-eyebrow h26-eyebrow-sun">Let us meet</p>
          <h2 className="h26-h2 h26-h2-white">Ready to find your Village?</h2>
          <p className="h26-close-text">
            ExpatPreneurs is by invitation. Every request is read by a person in the
            Village you are asking to join.
          </p>
          <div className="h26-ctas">
            <Link className="h26-btn h26-btn-white" href="/apply">Request your invitation</Link>
            <Link className="h26-btn h26-btn-clear" href="/discover">Discover the community</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
