import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { Arrow, Faces, GoArrow, PlayIcon, PHOTO, tintFor, initialsOf } from "@/components/design/parts";
import { whenText } from "@/lib/events";

export const metadata = {
  title: "Discover, ExpatPreneurs Global",
  description:
    "The Villages, Circles, people and events of a network of people building a business away from home.",
};

const TABS: [string, string][] = [
  ["featured", "Featured"],
  ["villages", "Villages"],
  ["circles", "Circles"],
  ["people", "People"],
  ["groups", "Groups and Pods"],
  ["events", "Events"],
  ["learning", "Learning and business"],
  ["media", "Watch and listen"],
];

// Photographs for pieces that have no cover of their own yet.
const COVERS = [PHOTO.ines, PHOTO.members, PHOTO.table, PHOTO.julien, PHOTO.kristiane];
const KIND: Record<string, string> = { video: "Video", episode: "Podcast", article: "Article" };

const statusLine: Record<string, string> = {
  open: "Open for invitation requests",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused",
  archived: "Archived",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string }>;
}) {
  const { show = "featured", q = "" } = await searchParams;
  const supabase = await createClient();

  // Every query here runs for somebody who is not signed in, so the database
  // decides what comes back: public profiles, public events, published
  // courses, and media that is not marked members only.
  const [
    { data: villages },
    { data: circles },
    { data: people },
    { data: groups },
    { data: events },
    { data: courses },
    { data: businesses },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .order("name"),
    supabase
      .from("circles")
      .select("id, name, capacity, village_id, status")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, headline, business_name, industry, village_id, avatar_url")
      .eq("public_profile", true)
      .eq("status", "active")
      .order("full_name")
      .limit(24),
    supabase
      .from("industry_groups")
      .select("id, slug, name, description")
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, slug, title, description, starts_at, ends_at, timezone, venue, is_online, village_id"
      )
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(12),
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration")
      .eq("status", "published")
      .order("title")
      .limit(12),
    supabase
      .from("businesses")
      .select("id, slug, name, category, tagline, logo_url")
      .eq("public", true)
      .limit(8),
    supabase
      .from("media_items")
      .select("id, slug, kind, title, summary, duration, published_at, cover_url")
      .eq("member_only", false)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const match = (...fields: (string | null | undefined)[]) =>
    !q || fields.some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase()));

  const shown = (key: string) => show === "featured" || show === key;
  const tabHref = (key: string) =>
    `/discover?show=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const vills = (villages ?? []).filter((v) =>
    match(v.name, v.city, v.country, v.summary)
  );
  const circs = (circles ?? []).filter((c) => match(c.name));
  const pers = (people ?? []).filter((p) =>
    match(p.full_name, p.headline, p.business_name, p.industry)
  );
  const grps = (groups ?? []).filter((g) => match(g.name, g.description));
  const evs = (events ?? []).filter((e) => match(e.title, e.description, e.venue));
  const crs = (courses ?? []).filter((c) => match(c.title, c.summary));
  const bizs = (businesses ?? []).filter((b) => match(b.name, b.category, b.tagline));
  const meds = (media ?? []).filter((m) => match(m.title, m.summary));

  const found =
    vills.length + circs.length + pers.length + grps.length +
    evs.length + crs.length + bizs.length + meds.length;

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const villageList = [...vills]
    .filter((v) => v.status in rank)
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
  const [lead, ...rest] = villageList;
  const statusClass = (s: string) => (s === "open" ? "d-open" : "d-soon");

  return (
    <PublicPage active="/discover">
      <PageBlocks slug="discover">
      <div className="d-page">
        <section style={{ padding: "64px 0 72px" }}>
          <div className="d-wrap d-hero" style={{ gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)" }}>
            <div>
              <p className="d-eyebrow">Discover</p>
              <h1 className="d-h1" style={{ marginTop: 16, maxWidth: "16ch" }}>Wherever you have landed, there is a Village for you.</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "44ch" }}>
                Find the Villages, Circles and people building a business away from home.
              </p>
              <form className="d-search" action="/discover" style={{ marginTop: 32 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7683" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
                <input type="hidden" name="show" value={show} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search Villages, Circles, members, events and businesses"
                  aria-label="Search the network"
                  autoComplete="off"
                />
                <button className="d-btn d-btn-sm d-btn-dark d-shine" type="submit" style={{ height: 40 }}>Search</button>
              </form>
              {q ? (
                <p className="d-small" style={{ marginTop: 14 }}>
                  {found
                    ? `${found} ${found === 1 ? "result" : "results"} for "${q}"`
                    : `Nothing matches "${q}" yet. Try a city, an industry or a name.`}
                </p>
              ) : null}
            </div>
            <div className="d-mosaic" role="img" aria-label="Members of the network">
              {/* eslint-disable @next/next/no-img-element */}
              <img src={PHOTO.tomas} alt="" style={{ marginTop: 56 }} />
              <img src={PHOTO.ines} alt="" />
              <img src={PHOTO.julien} alt="" style={{ marginTop: 32 }} />
              <img src={PHOTO.nadia} alt="" style={{ marginTop: -24 }} />
              <img src={PHOTO.kristiane} alt="" style={{ marginTop: -56, objectPosition: "center 20%" }} />
              {/* eslint-enable @next/next/no-img-element */}
              <div className="d-tile" style={{ marginTop: -32, background: "#0F1419", color: "#FFFFFF", padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <b style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", color: "#A8DCD1" }}>25+</b>
                <span style={{ fontSize: 13, lineHeight: 1.45, color: "#B9C3CD", marginTop: 6 }}>countries in the Dubai Village alone</span>
              </div>
            </div>
          </div>
        </section>

        <div className="d-wrap">
          <nav className="d-tabs" aria-label="Browse">
            {TABS.map(([key, label]) => (
              <Link className={show === key ? "on" : ""} href={tabHref(key)} key={key}>{label}</Link>
            ))}
          </nav>
        </div>

        {shown("villages") && lead ? (
          <section style={{ padding: "72px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head">
                <h2 className="d-h2">Villages</h2>
                <Link className="d-ulink" href="/villages">See all Villages</Link>
              </div>
              <div className="d-vfeat">
                <Link className="d-vcard" href={`/villages/${lead.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="d-cover"><img src={lead.cover_url ?? PHOTO.members} alt={`Members of the ${lead.name} Village`} /></span>
                  <span style={{ display: "block", padding: 24 }}>
                    <span className={`d-status ${statusClass(lead.status)}`} style={{ fontSize: 13 }}>{statusLine[lead.status] ?? lead.status}</span>
                    <b style={{ display: "block", marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: "-.03em" }}>{lead.name}</b>
                    {lead.summary ? <span className="d-body" style={{ display: "block", marginTop: 6 }}>{lead.summary}</span> : null}
                  </span>
                </Link>
                <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
                  {rest.map((v) => (
                    <Link className="d-vcard" href={`/villages/${v.slug}`} key={v.id} style={{ padding: 24 }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span className={`d-status ${statusClass(v.status)}`} style={{ fontSize: 13 }}>{statusLine[v.status] ?? v.status}</span>
                        <span className="d-small" style={{ fontSize: 13 }}>{v.country}</span>
                      </span>
                      <b style={{ display: "block", marginTop: 14, fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>{v.name}</b>
                      {v.summary ? <span className="d-body" style={{ display: "block", marginTop: 6 }}>{v.summary}</span> : null}
                      <span style={{ display: "block", marginTop: 16, fontSize: 14, fontWeight: 600 }}>
                        {v.status === "open" ? `Explore ${v.name}` : "Join the waitlist"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {shown("people") && pers.length ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head">
                <div>
                  <h2 className="d-h2">Members you will meet</h2>
                  <p className="d-small" style={{ marginTop: 10, fontSize: 15 }}>Members who have chosen to appear publicly.</p>
                </div>
                <Link className="d-ulink" href="/members">See all members</Link>
              </div>
              <div className="d-people d-people-5">
                {pers.slice(0, 10).map((p) => (
                  <Link className="d-person" key={p.id} href={`/members/${p.id}`}>
                    <span className="d-ph d-shine" style={p.avatar_url ? undefined : { background: tintFor(p.full_name) }}>
                      {p.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.avatar_url} alt={p.full_name} />
                      ) : (
                        <span className="d-ph-ini">{initialsOf(p.full_name)}</span>
                      )}
                    </span>
                    <b>{p.full_name}</b>
                    {p.headline || p.business_name ? (
                      <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{p.headline ?? p.business_name}</span>
                    ) : null}
                    <span className="d-small" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                      {[p.industry, villageName(p.village_id) ? `${villageName(p.village_id)} Village` : ""].filter(Boolean).join(", ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {shown("circles") && circs.length ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head" style={{ marginBottom: 20 }}>
                <div>
                  <h2 className="d-h2">Circles</h2>
                  <p className="d-small" style={{ marginTop: 10, fontSize: 15 }}>Your home base inside a Village. Up to fifty members, never more.</p>
                </div>
              </div>
              <div className="d-rows">
                {circs.map((c) => (
                  <Link className="d-row d-crow" key={c.id} href="/how-it-works">
                    <span>
                      <b style={{ display: "block", fontSize: 19 }}>{c.name}</b>
                      <span className="d-small" style={{ fontSize: 13 }}>{villageName(c.village_id)} Village</span>
                    </span>
                    <span className="d-body d-cdesc">
                      {c.status === "open" ? "Welcoming new members this month." : "Getting ready to welcome its first members."}
                    </span>
                    <span className="d-small" style={{ fontSize: 13 }}>Up to {c.capacity} members</span>
                    <span className={`d-status ${c.status === "open" ? "d-open" : "d-soon"}`} style={{ fontSize: 13 }}>
                      {c.status === "open" ? "Welcoming" : "Preparing"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {shown("groups") && grps.length ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head" style={{ marginBottom: 20 }}>
                <h2 className="d-h2">Industry Groups and Pods</h2>
                <Link className="d-ulink" href="/how-it-works">How they work</Link>
              </div>
              <div className="d-biz">
                {grps.map((g) => (
                  <Link className="d-brow" key={g.id} href="/groups">
                    <span className="d-ini" style={{ width: 52, height: 52, fontSize: 15, background: tintFor(g.name) }}>{initialsOf(g.name)}</span>
                    <span>
                      <b style={{ display: "block", fontSize: 17 }}>{g.name}</b>
                      {g.description ? <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{g.description}</span> : null}
                    </span>
                    <GoArrow />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {shown("events") && evs.length ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head" style={{ marginBottom: 20 }}>
                <h2 className="d-h2">Events</h2>
                <Link className="d-ulink" href="/events">All events</Link>
              </div>
              <div className="d-rows">
                {evs.map((e) => {
                  const d = new Date(e.starts_at);
                  return (
                    <Link className="d-row d-erow" key={e.id} href={`/e/${e.slug}`} style={{ gridTemplateColumns: "84px minmax(0,1fr) 170px" }}>
                      <span className="d-d">
                        <b>{d.getDate()}</b>
                        <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                      </span>
                      <span>
                        <b style={{ display: "block", fontSize: 19 }}>{e.title}</b>
                        <span className="d-body" style={{ display: "block", marginTop: 4, fontSize: 14 }}>
                          {whenText(e)}{e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""}
                        </span>
                      </span>
                      <span className="d-act d-status d-open" style={{ fontSize: 13 }}>Open to everyone</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {shown("learning") && (crs.length || bizs.length) ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head" style={{ marginBottom: 20 }}>
                <h2 className="d-h2">Learning and business</h2>
                <Link className="d-ulink" href="/businesses">Browse all</Link>
              </div>
              <div className="d-biz">
                {bizs.map((b) => (
                  <Link className="d-brow" key={b.id} href={`/businesses/${b.slug}`}>
                    {b.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img className="d-av" src={b.logo_url} alt="" style={{ width: 52, height: 52 }} />
                    ) : (
                      <span className="d-ini" style={{ width: 52, height: 52, fontSize: 15, background: tintFor(b.name) }}>{initialsOf(b.name)}</span>
                    )}
                    <span>
                      <b style={{ display: "block", fontSize: 17 }}>{b.name}</b>
                      <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{b.tagline ?? b.category}</span>
                    </span>
                    <GoArrow />
                  </Link>
                ))}
                {crs.map((c) => (
                  <Link className="d-brow" key={c.id} href={`/learning/${c.slug}`}>
                    <span className="d-ini" style={{ width: 52, height: 52, fontSize: 15, background: "#0F1419", color: "#A8DCD1" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /></svg>
                    </span>
                    <span>
                      <b style={{ display: "block", fontSize: 17 }}>{c.title}</b>
                      <span className="d-body" style={{ display: "block", marginTop: 2, fontSize: 14 }}>{c.summary ?? c.duration ?? c.level}</span>
                    </span>
                    <GoArrow />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {shown("media") && meds.length ? (
          <section style={{ padding: "96px 0 0" }}>
            <div className="d-wrap">
              <div className="d-head">
                <h2 className="d-h2">Watch and listen</h2>
                <Link className="d-ulink" href="/watch">See everything</Link>
              </div>
              <div className="d-media">
                <Link className="d-vid" href={`/watch/${meds[0].slug}`}>
                  <span className="d-thumb d-shine" style={{ height: 360 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={meds[0].cover_url ?? COVERS[0]} alt="" />
                    <span className="d-play"><PlayIcon size={22} /></span>
                    {meds[0].duration ? <span className="d-dur">{meds[0].duration}</span> : null}
                  </span>
                  <b style={{ display: "block", marginTop: 16, fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}>{meds[0].title}</b>
                  {meds[0].summary ? <span className="d-body" style={{ display: "block", marginTop: 6 }}>{meds[0].summary}</span> : null}
                </Link>
                <div>
                  {meds.slice(1, 5).map((m, i) => (
                    <Link className="d-mrow" key={m.id} href={`/watch/${m.slug}`}>
                      <span className="d-thumb" style={{ height: 80 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.cover_url ?? COVERS[(i + 1) % COVERS.length]} alt="" />
                      </span>
                      <span>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7683" }}>
                          {[KIND[m.kind] ?? m.kind, m.duration].filter(Boolean).join(", ")}
                        </span>
                        <b style={{ display: "block", marginTop: 4, fontSize: 15, lineHeight: 1.35 }}>{m.title}</b>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ padding: "96px 0 104px" }}>
          <div className="d-wrap">
            <div className="d-dark" style={{ borderRadius: 6, padding: 52, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
              <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                <span style={{ display: "block", marginBottom: 22 }}>
                  <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.julien, PHOTO.nadia]} size={48} />
                </span>
                <h2 className="d-h2">ExpatPreneurs grows through introductions.</h2>
                <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.6, color: "#B9C3CD" }}>
                  Know someone who belongs here? Or no Village in your city yet? Tell us where you are.
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link className="d-btn d-btn-mint d-shine" href="/apply">Request your invitation <Arrow /></Link>
                <Link className="d-btn d-btn-ghost" href="/villages/suggest">Suggest a city</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      </PageBlocks>
    </PublicPage>
  );
}
