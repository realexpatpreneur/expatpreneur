import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { PublicPage } from "@/components/public-page";
import { createClient } from "@/lib/supabase/server";
import { Arrow, Faces, PHOTO } from "@/components/design/parts";

export const metadata = { title: "How it works, ExpatPreneurs Global" };

const JOURNEY: [string, string][] = [
  ["Request an invitation", "Share your business and your expat journey."],
  ["Review", "Every request is read personally."],
  ["Welcome", "Once accepted, complete your profile and choose what the public can see."],
  ["Village Membership", "Membership begins when it is paid for. That is what opens the member side."],
  ["Join your Circle", "Once your membership begins you are placed in a Circle and added to its WhatsApp group."],
  ["Take part", "Ask, offer, meet people and explore other Villages."],
  ["Move with you", "If you change city, your profile and history come with you."],
];

const said: Record<string, [string, string]> = {
  open: ["Open", "d-open"],
  launching: ["Launching", "d-soon"],
  exploring: ["Being explored", "d-soon"],
};

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

  // The Global panel names the Villages there are, from the database.
  const supabase = await createClient();
  const [{ data: villages }, { data: counts }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, status")
      .in("status", ["open", "launching", "exploring"])
      .order("name"),
    supabase.from("village_public_counts").select("village_id, members"),
  ]);
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const listed = [...(villages ?? [])].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
  const first = listed.find((v) => v.status === "open");
  const firstCount = first
    ? (counts ?? []).find((c) => c.village_id === first.id)?.members ?? 0
    : 0;

  return (
    <PublicPage active="/how-it-works">
      <div className="d-page">
        {/* Hero */}
        <section style={{ padding: "64px 0 96px" }}>
          <div className="d-wrap d-hero">
            <div>
              <p className="d-eyebrow">How it works</p>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "15ch" }}>Belong in your city. Reach every other one.</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                Local community gives you belonging. The global network gives you
                continuity, reach and access. You get both.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                <Link className="d-btn d-btn-dark d-shine" href="/apply">Request your invitation <Arrow /></Link>
                <Link className="d-btn d-btn-line d-shine" href="/membership">See membership</Link>
              </div>
            </div>
            <div className="d-heroart" style={{ height: 470 }} role="img" aria-label="Members of the network in three Villages">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.tomas} alt="" style={{ left: 0, top: 48, width: "46%", height: "60%" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.ines} alt="" style={{ right: 0, top: 0, width: "48%", height: "56%" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.nadia} alt="" style={{ left: "30%", bottom: 0, width: "40%", height: "42%", border: "6px solid #FFFFFF" }} />
              <span className="d-label" style={{ position: "absolute", left: 12, top: 60 }}>Dubai</span>
              <span className="d-label" style={{ position: "absolute", right: 12, top: 12 }}>Lisbon</span>
              <div className="d-card-paper d-float" style={{ position: "absolute", right: 0, bottom: 36, display: "flex", alignItems: "center", gap: 12, maxWidth: 260 }}>
                <Faces srcs={[PHOTO.julien, PHOTO.tomas]} size={34} />
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>
                  <b style={{ display: "block" }}>Circle 02 coffee morning</b>
                  <span style={{ color: "#6B7683" }}>Bring one thing you need help with</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Three places at once */}
        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <p className="d-eyebrow">Three places at once</p>
            <div className="d-head" style={{ marginTop: 14, marginBottom: 0 }}>
              <h2 className="d-h2" style={{ maxWidth: "22ch" }}>Big enough to open doors. Small enough to know each other.</h2>
              <p className="d-body" style={{ fontSize: 16, maxWidth: "40ch" }}>
                Every member belongs to all three at once. As the network grows,
                your home base stays human sized.
              </p>
            </div>
            <div className="d-zoomline" aria-hidden="true">
              <span>Every Village</span><span>Your city</span><span>Up to fifty people</span>
            </div>
            <div className="d-scale" style={{ marginTop: 16 }}>
              <article className="d-sc d-lift d-lift-mint" style={{ background: "#0F1419", color: "#FFFFFF" }}>
                <div className="d-sc-bd">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span className="d-lbl" style={{ color: "#A8DCD1" }}>Reach</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PHOTO.globe} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />
                  </div>
                  <b style={{ display: "block", marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: "-.03em" }}>Global</b>
                  <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.6, color: "#B9C3CD" }}>
                    The whole network. Reach members, events and markets wherever
                    there is a Village.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 24 }}>
                    {listed.map((v) => {
                      const [label, cls] = said[v.status] ?? [v.status, "d-soon"];
                      return (
                        <Link className="d-city" key={v.slug} href={`/villages/${v.slug}`}>
                          <b style={{ fontSize: 17 }}>{v.name}</b>
                          <span className={`d-status ${cls}`} style={{ fontSize: 13 }}>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </article>
              <article className="d-sc d-lift" style={{ border: "1.5px solid #0F1419", background: "#FFFFFF" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="d-sc-ph"><img src={PHOTO.members} alt="Members of one Village working through a problem together" style={{ objectPosition: "40% center" }} /></div>
                <div className="d-sc-bd">
                  <span className="d-lbl d-blue">Home</span>
                  <b style={{ display: "block", marginTop: 8, fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>Village</b>
                  <p className="d-body" style={{ marginTop: 8 }}>
                    Your city. Local gatherings, local knowledge and the people
                    building businesses around you.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 20 }}>
                    <Faces srcs={[PHOTO.tomas, PHOTO.julien, PHOTO.nadia]} size={34} />
                    {first && firstCount ? <span className="d-small" style={{ fontSize: 13 }}>{firstCount} members in {first.name}</span> : null}
                  </div>
                </div>
              </article>
              <article className="d-sc d-lift" style={{ border: "1.5px solid #0F1419", background: "#FFFFFF" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="d-sc-ph"><img src={PHOTO.table} alt="A table set for a small gathering" /></div>
                <div className="d-sc-bd">
                  <span className="d-lbl" style={{ color: "#2F8F77" }}>Belonging</span>
                  <b style={{ display: "block", marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-.03em" }}>Circle</b>
                  <p className="d-body" style={{ marginTop: 8 }}>
                    A home base of up to fifty members, where lasting relationships form.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 20 }}>
                    <Faces srcs={[PHOTO.ines, PHOTO.tomas]} size={34} />
                    <span className="d-small" style={{ fontSize: 13 }}>Never more than 50</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Across all three */}
        <section className="d-sec d-washed" style={{ padding: "96px 0" }}>
          <div className="d-wrap">
            <p className="d-eyebrow">Across all three</p>
            <h2 className="d-h2" style={{ marginTop: 14, maxWidth: "24ch" }}>Your field and your goals get their own people too.</h2>
            <div className="d-groups" style={{ marginTop: 40 }}>
              <article className="d-gcard">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <b style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>Industry Groups</b>
                  <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.julien]} size={38} />
                </div>
                <p className="d-body" style={{ marginTop: 14, fontSize: 16 }}>
                  Stable groups by profession, such as Creative &amp; Design or
                  Hospitality. They connect you with people in your field across
                  Circles and, over time, across Villages.
                </p>
              </article>
              <article className="d-gcard">
                <b style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>Pods</b>
                <p className="d-body" style={{ marginTop: 14, fontSize: 16 }}>
                  Small groups of about six members working toward a shared goal,
                  such as accountability or entering a new market. Each Pod has a
                  lead, a rhythm and an end date.
                </p>
                <div className="d-seats" aria-label="Six seats in a Pod, five taken">
                  {/* eslint-disable @next/next/no-img-element */}
                  <img src={PHOTO.nadia} alt="" />
                  <img src={PHOTO.tomas} alt="" />
                  <img src={PHOTO.kristiane} alt="" style={{ objectPosition: "center 20%" }} />
                  <img src={PHOTO.julien} alt="" />
                  <img src={PHOTO.ines} alt="" />
                  {/* eslint-enable @next/next/no-img-element */}
                  <span className="d-plus" style={{ fontSize: 18 }}>+</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Where things happen */}
        <section className="d-sec">
          <div className="d-wrap">
            <p className="d-eyebrow">Where things happen</p>
            <h2 className="d-h2" style={{ marginTop: 14, maxWidth: "22ch" }}>A chat for every day, a platform for everything else, a table every month.</h2>
            <div className="d-where" style={{ marginTop: 48 }}>
              <div className="d-wcol">
                <b style={{ display: "block", fontSize: 19 }}>Daily conversation on WhatsApp</b>
                <p className="d-body" style={{ marginTop: 8 }}>Each Circle, Industry Group and Pod has its own private WhatsApp group.</p>
                <div className="d-vis" style={{ background: "#F4F6F8", padding: 18, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
                  <div className="d-bub" style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", alignSelf: "flex-start", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Faces srcs={[PHOTO.nadia]} size={26} /><span>Anyone know a good bilingual accountant?</span>
                  </div>
                  <div className="d-bub" style={{ background: "#0F1419", color: "#FFFFFF", alignSelf: "flex-end" }}>Kenji at Numbers &amp; Co. I will intro you.</div>
                  <div className="d-bub" style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", alignSelf: "flex-start", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Faces srcs={[PHOTO.ines]} size={26} /><span>Seconded. He did mine too.</span>
                  </div>
                </div>
              </div>
              <div className="d-wcol">
                <b style={{ display: "block", fontSize: 19 }}>Everything else on the platform</b>
                <p className="d-body" style={{ marginTop: 8 }}>Your profile, the Directory, Ask &amp; Offer, events, businesses and learning.</p>
                <div className="d-vis" style={{ border: "1px solid #0F1419", background: "#FFFFFF", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Faces srcs={[PHOTO.tomas]} size={52} />
                    <span style={{ fontSize: 14, lineHeight: 1.35 }}><b style={{ display: "block" }}>Tomás Ribeiro</b><span style={{ color: "#6B7683" }}>Brand designer, Norte Studio</span></span>
                  </div>
                  <p className="d-small" style={{ marginTop: 14, fontSize: 13 }}>São Paulo, Lisbon, now Dubai</p>
                  <p className="d-body" style={{ marginTop: 10, fontSize: 13 }}><b style={{ color: "#0F1419" }}>Can help with:</b> brand identity, naming, pitch decks</p>
                  <p className="d-body" style={{ marginTop: 6, fontSize: 13 }}><b style={{ color: "#0F1419" }}>Looking for:</b> hospitality clients in the Gulf</p>
                </div>
              </div>
              <div className="d-wcol">
                <b style={{ display: "block", fontSize: 19 }}>In person every month</b>
                <p className="d-body" style={{ marginTop: 8 }}>Each Village holds at least one meaningful gathering a month.</p>
                <div className="d-vis">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PHOTO.table} alt="The table at a founders dinner" />
                  <span style={{ position: "absolute", left: 14, bottom: 14, background: "#0F1419", color: "#FFFFFF", borderRadius: 4, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>Founders dinner, Dubai Marina</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* From invitation to your Circle */}
        <section className="d-sec d-sec-top0">
          <div className="d-wrap d-path">
            <div>
              <p className="d-eyebrow">From invitation to your Circle</p>
              <h2 className="d-h2" style={{ marginTop: 14 }}>Six steps from new in town to known in the room.</h2>
              <figure style={{ marginTop: 32 }}>
                <span className="d-shine" style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PHOTO.reader} alt="A member who reads invitation requests" style={{ width: "100%", height: 280, objectFit: "cover", objectPosition: "85% 30%" }} />
                </span>
                <figcaption className="d-body" style={{ marginTop: 14 }}>
                  Every request is read personally, by people in the Village you are asking to join.
                </figcaption>
              </figure>
            </div>
            <ol>
              {JOURNEY.map(([title, text], i) => (
                <li className="d-pstep" key={title}>
                  <span className="d-n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{title}</h3>
                    <p className="d-body" style={{ marginTop: 6 }}>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing */}
        <section className="d-sec d-sec-top0">
          <div className="d-wrap">
            <div className="d-dark" style={{ borderRadius: 6, padding: 52, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flex: "1 1 460px", minWidth: 0 }}>
                <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.nadia]} size={52} />
                <h2 className="d-h2">Your Circle is waiting to meet you.</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link className="d-btn d-btn-mint d-shine" href="/apply">Request your invitation <Arrow /></Link>
                <Link className="d-btn d-btn-ghost" href="/membership">See membership</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}
