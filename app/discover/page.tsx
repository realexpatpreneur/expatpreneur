import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { DCard, DPerson, DSec, DBand } from "@/components/discover-cards";
import { Ic } from "@/components/icon";
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
      .select("id, slug, name, city, country, status, summary")
      .order("name"),
    supabase
      .from("circles")
      .select("id, name, capacity, village_id, status")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, headline, business_name, industry, village_id")
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
      .select("id, slug, name, category, summary, image_url")
      .eq("public", true)
      .limit(8),
    supabase
      .from("media_items")
      .select("id, slug, kind, title, summary, duration, published_at")
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
  const bizs = (businesses ?? []).filter((b) => match(b.name, b.category, b.summary));
  const meds = (media ?? []).filter((m) => match(m.title, m.summary));

  const found =
    vills.length + circs.length + pers.length + grps.length +
    evs.length + crs.length + bizs.length + meds.length;

  return (
    <PublicPage active="/discover">
      <section className="pubsec dhero">
        <h1>Wherever you have landed, there is a Village for you</h1>
        <p className="intro">
          Find the Villages, Circles and people building a business away from
          home.
        </p>

        <form className="input dsearch" action="/discover">
          <Ic name="search" />
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search Villages, Circles, members, events and businesses"
            aria-label="Search the network"
            autoComplete="off"
          />
        </form>

        {q ? (
          <p className="dcount">
            {found
              ? `${found} ${found === 1 ? "result" : "results"} for "${q}"`
              : `Nothing matches "${q}" yet. Try a city, an industry or a name.`}
          </p>
        ) : null}

        <div className="dpills">
          {TABS.map(([key, label]) => (
            <Link
              className={`dpill ${show === key ? "on" : ""}`}
              href={tabHref(key)}
              key={key}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        {shown("villages") && vills.length ? (
          <DSec title="Villages" href="/villages">
            {vills.map((v, i) => (
              <DCard
                key={v.id}
                i={i}
                href={`/villages/${v.slug}`}
                kicker={v.country}
                title={v.name}
                sub={v.summary}
                meta={statusLine[v.status] ?? v.status}
              />
            ))}
          </DSec>
        ) : null}

        {shown("people") && pers.length ? (
          <DSec title="Members you will meet" href="/members" people>
            {pers.slice(0, 10).map((p, i) => (
              <DPerson
                key={p.id}
                i={i}
                href={`/members/${p.id}`}
                name={p.full_name}
                line={[p.industry, villageName(p.village_id)]
                  .filter(Boolean)
                  .join(", ")}
              />
            ))}
          </DSec>
        ) : null}

        {shown("circles") && circs.length ? (
          <DSec title="Circles">
            {circs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href="/how-it-works"
                kicker={`${villageName(c.village_id)} Village`}
                title={c.name}
                sub={
                  c.status === "open"
                    ? "Welcoming new members this month"
                    : "Opens when a Circle reaches 45 members"
                }
                meta={`Up to ${c.capacity} members`}
              />
            ))}
          </DSec>
        ) : null}

        {show === "featured" ? (
          <DBand
            title="ExpatPreneurs grows through introductions."
            line="Know someone who belongs here?"
            cta="Request your invitation"
            href="/apply"
          />
        ) : null}

        {shown("groups") && grps.length ? (
          <DSec title="Industry Groups and Pods">
            {grps.map((g, i) => (
              <DCard
                key={g.id}
                i={i + 2}
                href="/groups"
                kicker="Industry Group"
                title={g.name}
                sub={g.description}
              />
            ))}
          </DSec>
        ) : null}

        {shown("events") && evs.length ? (
          <DSec title="Events" href="/events">
            {evs.map((e, i) => (
              <DCard
                key={e.id}
                i={i}
                href={`/events/${e.slug}`}
                kicker={whenText(e)}
                title={e.title}
                sub={e.description}
                meta={e.is_online ? "Online" : e.venue}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && crs.length ? (
          <DSec title="Learning" href="/learning">
            {crs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href={`/learning/${c.slug}`}
                kicker={c.duration ?? c.level}
                title={c.title}
                sub={c.summary}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && bizs.length ? (
          <DSec title="Businesses in the network" href="/businesses">
            {bizs.map((b, i) => (
              <DCard
                key={b.id}
                i={i + 3}
                href={`/businesses/${b.slug}`}
                kicker={b.category}
                title={b.name}
                sub={b.summary}
                image={b.image_url}
              />
            ))}
          </DSec>
        ) : null}

        {shown("media") && meds.length ? (
          <DSec title="Watch and listen" href="/watch">
            {meds.map((m, i) => (
              <DCard
                key={m.id}
                i={i + 2}
                href={`/watch/${m.slug}`}
                kicker={[m.kind, m.duration].filter(Boolean).join(", ")}
                title={m.title}
                sub={m.summary}
              />
            ))}
          </DSec>
        ) : null}
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <DBand
          end
          title="Find the Village nearest you."
          line="If there is not one yet, tell us where you are."
          cta="Request your invitation"
          href="/apply"
        />
      </section>
    </PublicPage>
  );
}