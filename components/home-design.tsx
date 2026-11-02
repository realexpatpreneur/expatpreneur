import Link from "next/link";
import { Arrow, Faces, Plus, PHOTO } from "@/components/design/parts";

type Village = {
  slug: string;
  name: string;
  country: string | null;
  status: string;
  summary: string | null;
  members: number;
  circles: number;
};

// Who appears beside each Village on the page, until members' own
// photographs are there to use.
const VILLAGE_FACES: Record<string, string[]> = {
  dubai: [PHOTO.tomas, PHOTO.julien, PHOTO.nadia],
  lisbon: [PHOTO.ines],
};

function list(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const PEOPLE: [string, string, string, string][] = [
  [PHOTO.tomas, "Tomás Ribeiro", "Brand designer, Norte Studio", "São Paulo, Lisbon, now Dubai"],
  [PHOTO.ines, "Inês Carvalho", "Founder, Casa Tinta", "Rio, Spain, now Lisbon"],
  [PHOTO.julien, "Julien Moreau", "Cofounder, Stackleaf", "France, Canada, now Dubai"],
  [PHOTO.nadia, "Nadia Mbarga", "Founder, Mbarga Hospitality", "Cameroon, France, now Dubai"],
];

const JOURNEY: [string, string, string, string][] = [
  [PHOTO.julien, "Week two", "Welcomed into a Circle of fifty", "Julien, his Circle Host, adds him to the group. Thirty three founders from a dozen countries say hello before lunch."],
  [PHOTO.nadia, "Month one", "A seat at the founders dinner", "No pitches, one long table. He sits beside Nadia, who runs cafés across the city and needs a new identity for the next one."],
  [PHOTO.ines, "Month three", "An answer from another Village", "A client wants to launch in Lisbon too. He posts an Ask, and Inês replies from Lisbon with the copywriter she trusts."],
];

const STEPS: [string, string][] = [
  ["Request an invitation", "Tell us about you, your business and your expat journey."],
  ["Review", "A person in your chosen Village reads it."],
  ["Welcome", "Complete your profile and choose what the public can see."],
  ["Village Membership", "Membership begins when it is paid for."],
  ["Join your Circle", "Once it begins you are placed in a Circle and added to its WhatsApp group."],
  ["Take part", "Ask, offer, meet and explore other Villages."],
  ["Move with you", "Change city and your profile and history come with you."],
];

const ACTS: [string, string, string][] = [
  ["M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 6 17.2L4.3 13a1.5 1.5 0 0 1 2.7-1.3L8 13", "Ask and offer", "Post what you need or what you can give, and track it until it is resolved."],
  ["M15.7 15.7 20 20M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z", "Find the right people", "Search by skill, language and the markets people actually know."],
  ["M3.5 10h17M8 3v4M16 3v4M6 5h12a2.5 2.5 0 0 1 2.5 2.5v10.5a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V7.5A2.5 2.5 0 0 1 6 5z", "Meet in person", "Monthly gatherings in your Village, and events in other cities."],
  ["M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", "Explore new markets", "Talk to members who already build where you want to go."],
];

// The home page as the design board lays it out: a person in every
// section, the change from arriving alone to belonging told through one
// member, and the Villages read from the database.
export function HomeDesign({ villages }: { villages: Village[] }) {
  const open = villages.filter((v) => v.status === "open").map((v) => v.name);
  const next = villages.filter((v) => v.status === "launching").map((v) => v.name);
  const pill = [
    open.length ? `${list(open)} ${open.length === 1 ? "is" : "are"} open.` : "",
    next.length ? `${list(next)} ${next.length === 1 ? "is" : "are"} next.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="d-page">
      {/* Hero */}
      <section style={{ padding: "72px 0 80px" }}>
        <div className="d-wrap d-hero">
          <div>
            {pill ? <span className="d-pill">{pill}</span> : null}
            <h1 className="d-h1" style={{ marginTop: 24, maxWidth: "15ch" }}>
              Arrive as an Expat. <span className="d-blue">Build like a local.</span>
            </h1>
            <p className="d-lead" style={{ marginTop: 22, maxWidth: "46ch" }}>
              A curated network for founders building in a country that is not
              their own. A Circle in your city who know your name, and people
              you can trust in every other Village.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
              <Link className="d-btn d-btn-dark d-shine d-glint" href="/apply">
                Request your invitation <Arrow />
              </Link>
              <Link className="d-btn d-btn-line d-shine" href="/villages">
                Find your Village
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40, paddingTop: 28, borderTop: "1px solid #E3E6EA" }}>
              <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.julien, PHOTO.nadia]} size={42} />
              <p className="d-body" style={{ maxWidth: "34ch", fontSize: 14 }}>
                <b style={{ color: "#0F1419" }}>Founders from more than 25 countries,</b>{" "}
                meeting every month in their own city.
              </p>
            </div>
          </div>

          <div className="d-heroart" role="img" aria-label="Members of the network, a reply to an Ask and an upcoming founders dinner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="d-ha-tomas" src={PHOTO.tomas} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="d-ha-ines" src={PHOTO.ines} alt="" />
            <div className="d-card-paper d-float d-ha-reply">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Faces srcs={[PHOTO.ines]} size={32} />
                <span style={{ fontSize: 13, lineHeight: 1.3 }}>
                  <b style={{ display: "block" }}>Inês, Lisbon Village</b>
                  <span style={{ color: "#6B7683" }}>replied to your Ask</span>
                </span>
              </div>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.45 }}>
                &ldquo;I worked with a great Portuguese copywriter. I can introduce you.&rdquo;
              </p>
            </div>
            <div className="d-card-ink d-float d-float-2 d-ha-dinner">
              <div className="d-datechip"><b>Thu</b><span>7:30 PM</span></div>
              <div>
                <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Founders dinner</b>
                <span style={{ fontSize: 12, color: "#B9C3CD" }}>Dubai Marina, 24 going</span>
              </div>
            </div>
            <span className="d-label" style={{ position: "absolute", right: 16, top: 16 }}>Tomás, São Paulo to Dubai</span>
          </div>
        </div>
      </section>

      {/* People */}
      <section className="d-sec d-sec-top0">
        <div className="d-wrap">
          <div className="d-head">
            <h2 className="d-h2" style={{ maxWidth: "24ch" }}>Everyone here once landed somewhere new.</h2>
            <Link className="d-ulink" href="/members">Meet the members</Link>
          </div>
          <div className="d-people">
            {PEOPLE.map(([src, name, role, route]) => (
              <div className="d-person" key={name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="d-ph d-shine"><img src={src} alt={name} /></span>
                <b>{name}</b>
                <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{role}</span>
                <span className="d-small" style={{ display: "block", marginTop: 8, fontSize: 13 }}>{route}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The change, told through one member */}
      <section className="d-sec d-dark">
        <div className="d-wrap d-journey">
          <div>
            <p className="d-eyebrow">What changes when you join</p>
            <h2 className="d-h2" style={{ marginTop: 16 }}>
              Tomás moved to Dubai knowing nobody. Six months later, people come to him.
            </h2>
            <figure className="d-zoom" style={{ marginTop: 36, position: "relative", borderRadius: 6, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.tomas} alt="Tomás Ribeiro" style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover" }} />
              <figcaption style={{ position: "absolute", left: 16, right: 16, bottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="d-label">Dubai Village</span>
                <span className="d-label">Circle 02</span>
                <span className="d-label">Creative &amp; Design</span>
              </figcaption>
            </figure>
          </div>
          <ol>
            <li className="d-jstep">
              <span className="d-jfirst">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              </span>
              <div>
                <span className="d-when" style={{ color: "#8C98A4" }}>Day one</span>
                <h3>A new city, a new licence, no one to ask</h3>
                <p>He brings Norte Studio from São Paulo by way of Lisbon. Every contact he had stays behind.</p>
              </div>
            </li>
            {JOURNEY.map(([src, when, title, text]) => (
              <li className="d-jstep" key={when}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <div>
                  <span className="d-when">{when}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
            <li className="d-jstep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.tomas} alt="" style={{ borderColor: "#FFFFFF" }} />
              <div>
                <span className="d-when" style={{ color: "#FFFFFF" }}>Month six</span>
                <h3>Now he is the one people ask</h3>
                <p>When Priya needs a product photographer, Tomás sends two names within the hour. He is not new here any more.</p>
                <Link className="d-btn d-btn-mint d-shine" href="/how-it-works" style={{ marginTop: 22, height: 48 }}>
                  See how it works <Arrow />
                </Link>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* A member's words */}
      <section className="d-sec">
        <div className="d-wrap d-split">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO.ines} alt="Inês Carvalho" style={{ width: "100%", maxWidth: 440, aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 6, justifySelf: "center" }} />
          <figure>
            <svg width="40" height="32" viewBox="0 0 40 32" aria-hidden="true"><path d="M0 32V19C0 8 6 1.5 16 0l2 4.5C11.5 6.5 8.5 10.5 8.5 16H16v16H0zm24 0V19c0-11 6-17.5 16-19v4.5C33.5 6.5 32.5 10.5 32.5 16H40v16H24z" fill="#A8DCD1" /></svg>
            <blockquote className="d-quote" style={{ marginTop: 20 }}>
              I moved to Lisbon knowing two people. Four months later I had a
              supplier, an accountant and somebody to have dinner with on a Tuesday.
            </blockquote>
            <figcaption style={{ marginTop: 28, fontSize: 15, lineHeight: 1.45 }}>
              <b style={{ display: "block" }}>Inês Carvalho</b>
              <span style={{ color: "#6B7683" }}>Founder of Casa Tinta, Lisbon Village</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* How it is built */}
      <section className="d-sec d-sec-top0">
        <div className="d-wrap">
          <div className="d-head" style={{ marginBottom: 40 }}>
            <div>
              <p className="d-eyebrow">How it is built</p>
              <h2 className="d-h2" style={{ marginTop: 14, maxWidth: "24ch" }}>Big enough to open doors. Small enough to know each other.</h2>
            </div>
            <p className="d-body" style={{ fontSize: 16, maxWidth: "40ch" }}>
              Every member belongs to three places at once. As the network grows,
              your home base stays human sized.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO.members} alt="Members of one Village working through a problem together" style={{ width: "100%", height: 380, objectFit: "cover", borderRadius: "6px 6px 0 0" }} />
          <div className="d-layers">
            {[
              [PHOTO.globe, "Global", "Reach members, events and markets wherever there is a Village."],
              [PHOTO.village, "Village", "Your city. Local gatherings, local knowledge and the people building around you."],
              [PHOTO.circle, "Circle", "Your home base of up to fifty members, where real relationships form."],
            ].map(([src, title, text]) => (
              <div className="d-layer" key={title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <div>
                  <b style={{ display: "block", fontSize: 18 }}>{title}</b>
                  <p className="d-body" style={{ marginTop: 6 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What members do */}
      <section className="d-sec d-washed">
        <div className="d-wrap d-split" style={{ alignItems: "start" }}>
          <div>
            <p className="d-eyebrow">What members do here</p>
            <h2 className="d-h2" style={{ marginTop: 14 }}>Ask, offer, and meet the person who has done it before.</h2>
            <ul className="d-acts" style={{ marginTop: 36 }}>
              {ACTS.map(([path, title, text]) => (
                <li key={title}>
                  <span className="d-ic">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
                  </span>
                  <span>
                    <b style={{ display: "block", fontSize: 17 }}>{title}</b>
                    <span className="d-body" style={{ display: "block", marginTop: 4 }}>{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <article className="d-ask d-lift" aria-label="An example Ask and its reply">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: "1px solid #E3E6EA", fontSize: 13, color: "#6B7683" }}>
              <b style={{ letterSpacing: ".08em", textTransform: "uppercase", color: "#0F1419" }}>Ask</b>
              <span>All Villages</span>
              <span>Suppliers</span>
              <span className="d-status d-open" style={{ marginLeft: "auto", fontSize: 13 }}>Open</span>
            </div>
            <div style={{ padding: "24px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Faces srcs={[PHOTO.tomas]} size={44} />
                <span style={{ fontSize: 14, lineHeight: 1.35 }}>
                  <b style={{ display: "block" }}>Tomás Ribeiro</b>
                  <span style={{ color: "#6B7683" }}>Dubai Village. Yesterday</span>
                </span>
              </div>
              <h3 style={{ marginTop: 18, fontSize: 22, lineHeight: 1.3, fontWeight: 700, letterSpacing: "-.02em" }}>
                Looking for a copywriter who writes in Portuguese and Arabic
              </h3>
              <p className="d-body" style={{ marginTop: 10 }}>
                For a hospitality client launching in Dubai and Lisbon. Around ten
                pages of website copy in October.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 14, padding: "20px 22px", borderTop: "1px solid #E3E6EA", background: "#FAFBFC" }}>
              <Faces srcs={[PHOTO.ines]} size={44} />
              <span style={{ fontSize: 15, lineHeight: 1.55 }}>
                <b>Inês Carvalho</b> <span style={{ color: "#6B7683", fontSize: 13 }}>Lisbon Village</span>
                <span style={{ display: "block", marginTop: 4 }}>
                  I worked with a great Portuguese copywriter. Not sure about
                  Arabic, but I can introduce you.
                </span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 22px", background: "#0F1419", color: "#FFFFFF", fontSize: 14 }}>
              <span>Dubai to Lisbon in one reply.</span>
              <span style={{ color: "#A8DCD1", fontWeight: 600 }}>Members only</span>
            </div>
          </article>
        </div>
      </section>

      {/* The path in */}
      <section className="d-sec">
        <div className="d-wrap">
          <div className="d-split" style={{ alignItems: "end", gap: 40 }}>
            <div>
              <p className="d-eyebrow">From invitation to your Circle</p>
              <h2 className="d-h2" style={{ marginTop: 14, maxWidth: "22ch" }}>Six steps from new in town to known in the room.</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, justifySelf: "end", maxWidth: 420 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.reader} alt="A member who reads invitation requests" style={{ width: 132, height: 88, objectFit: "cover", objectPosition: "85% 30%", borderRadius: 6, flex: "none" }} />
              <p className="d-body">Every request is read by a person in the Village you are asking to join.</p>
            </div>
          </div>
          <ol className="d-steps6" style={{ marginTop: 56 }}>
            {STEPS.map(([title, text], i) => (
              <li key={title} style={i >= 3 ? { borderTopColor: i === 5 ? "#2F8F77" : "#4074AE" } : undefined}>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === 5 ? "#2F8F77" : i >= 3 ? "#4074AE" : "#6B7683" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Founder */}
      <section className="d-sec d-sec-top0">
        <div className="d-wrap">
          <div className="d-founder">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTO.kristiane} alt="Kristiane Charrier, founder of ExpatPreneurs" style={{ width: "100%", height: "100%", minHeight: 420, objectFit: "cover", objectPosition: "center 20%" }} />
            <div style={{ padding: "56px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p className="d-eyebrow d-on-dark">From the founder</p>
              <h2 className="d-h2 d-light" style={{ marginTop: 14 }}>Six countries, one lesson: local belonging needs global continuity.</h2>
              <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.65, color: "#B9C3CD", maxWidth: "48ch" }}>
                Kristiane Charrier rebuilt her network at every move. The first
                ExpatPreneurs community, in Luanda, showed her why a local group
                is not enough on its own.
              </p>
              <Link className="d-ulink-light" href="/media" style={{ alignSelf: "flex-start", marginTop: 28 }}>Read the story</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Villages */}
      {villages.length ? (
        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <div className="d-head">
              <div>
                <p className="d-eyebrow">The Villages</p>
                <h2 className="d-h2" style={{ marginTop: 14 }}>Find yours.</h2>
              </div>
              <Link className="d-ulink" href="/villages/suggest">Suggest a city</Link>
            </div>
            <div className="d-rows">
              {villages.map((v) => {
                const isOpen = v.status === "open";
                const faces = VILLAGE_FACES[v.slug];
                return (
                  <div className="d-row d-vrow" key={v.slug}>
                    <span>
                      <b style={{ display: "block", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>{v.name}</b>
                      <span className="d-small">{v.country}</span>
                    </span>
                    <p className="d-body d-vdesc">
                      {isOpen && v.members
                        ? `${v.members} members across ${v.circles} ${v.circles === 1 ? "Circle" : "Circles"}, meeting every month.`
                        : v.summary}
                    </p>
                    <span className="d-vdesc">{faces ? <Faces srcs={faces} size={34} /> : <Plus />}</span>
                    <span className={`d-status ${isOpen ? "d-open" : "d-soon"}`}>
                      {isOpen ? "Open" : v.status === "launching" ? "Launching" : "Being explored"}
                    </span>
                    <Link className={`d-btn d-btn-sm d-shine ${isOpen ? "d-btn-dark" : "d-btn-line"}`} href={`/villages/${v.slug}`}>
                      {isOpen ? `Explore ${v.name}` : "Join the waitlist"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Closing */}
      <section className="d-sec d-sec-top0">
        <div className="d-wrap">
          <div className="d-closer d-zoom">
            <div style={{ padding: "56px 52px" }}>
              <h2 className="d-h2">Your Circle is waiting to meet you.</h2>
              <p className="d-body" style={{ marginTop: 16, fontSize: 16, maxWidth: "44ch" }}>
                ExpatPreneurs is by invitation. Tell us who you are, and a person
                in your Village will read it.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
                <Link className="d-btn d-btn-dark d-shine d-glint" href="/apply">
                  Request your invitation <Arrow />
                </Link>
                <Link className="d-btn d-btn-line d-shine" href="/discover">
                  Discover the community
                </Link>
              </div>
            </div>
            <div style={{ position: "relative", minHeight: 320, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.members} alt="Members working together" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "30% center" }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
