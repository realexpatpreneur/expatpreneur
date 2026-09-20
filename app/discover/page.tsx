import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { whenText } from "@/lib/events";

export const metadata = {
  title: "Discover, ExpatPreneurs Global",
  description:
    "The Villages, Circles, people and events of a network of people building a business away from home.",
};

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

const tabs = [
  ["featured", "Featured"],
  ["villages", "Villages"],
  ["circles", "Circles"],
  ["people", "People"],
  ["groups", "Industry Groups"],
  ["events", "Events"],
  ["learning", "Learning"],
  ["watch", "Watch and listen"],
] as const;

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
    supabase.from("industry_groups").select("id, slug, name, description").order("name"),
    supabase
      .from("events")
      .select("id, slug, title, description, starts_at, ends_at, timezone, venue, is_online, village_id")
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

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Wherever you have landed, there is a Village for you</h1>
          <p className="lead">
            The Villages, Circles, people and events of a network of people
            building a business away from home.
          </p>

          <form className="searchrow" action="/discover" style={{ marginTop: 18 }}>
            <input type="hidden" name="show" value={show} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search Villages, Circles, people and events"
              aria-label="Search"
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          <div className="tabs">
            {tabs.map(([key, label]) => (
              <Link
                className={`chip ${show === key ? "mint" : ""}`}
                href={tabHref(key)}
                key={key}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {shown("villages") ? (
          <section className="band">
            <h2>Villages</h2>
            <p className="muted small">
              A Village opens where there are enough people, a shared language
              and somebody local to run it.
            </p>
            <div className="grid" style={{ marginTop: 16 }}>
              {(villages ?? [])
                .filter((v) => match(v.name, v.city, v.country, v.summary))
                .map((village, i) => (
                  <Link className="card" href={`/villages/${village.slug}`} key={village.id}>
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {village.city}
                    </div>
                    <div className="kind">{village.country}</div>
                    <p>{village.summary}</p>
                    <div className="meta">
                      <span className="chip">
                        {village.status === "open"
                          ? "Open, by invitation"
                          : village.status === "launching"
                            ? "Launching"
                            : village.status === "exploring"
                              ? "Being explored"
                              : village.status}
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
            <p style={{ marginTop: 18 }}>
              <Link className="btn" href="/villages/suggest">
                Your city is not here?
              </Link>
            </p>
          </section>
        ) : null}

        {shown("people") ? (
          <section className="band">
            <h2>Members you would meet</h2>
            <p className="muted small">
              Members choose whether to appear here. An email address or a
              phone number is never public.
            </p>
            <div className="grid" style={{ marginTop: 16 }}>
              {(people ?? [])
                .filter((p) =>
                  match(p.full_name, p.headline, p.business_name, p.industry)
                )
                .map((person, i) => (
                  <article className="card" key={person.id}>
                    <div className={`cover ${covers[(i + 2) % covers.length]}`}>
                      {person.full_name
                        .split(" ")
                        .map((part: string) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="kind">
                      {person.industry ?? person.business_name ?? ""}
                    </div>
                    <p>
                      <b>{person.full_name}</b>
                      {person.headline ? `. ${person.headline}` : ""}
                    </p>
                    <div className="meta">
                      <span className="chip">{villageName(person.village_id)}</span>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ) : null}

        {shown("circles") ? (
          <section className="band">
            <h2>Circles</h2>
            <p className="muted small">
              A Village is made of Circles of up to fifty people, each with a
              host who knows everybody in it.
            </p>
            <div className="grid" style={{ marginTop: 16 }}>
              {(circles ?? [])
                .filter((c) => match(c.name))
                .slice(0, 12)
                .map((circle, i) => (
                  <article className="card" key={circle.id}>
                    <div className={`cover ${covers[(i + 1) % covers.length]}`}>
                      {circle.name}
                    </div>
                    <div className="kind">{villageName(circle.village_id)}</div>
                    <p>
                      Up to {circle.capacity} people who are meant to know each
                      other.
                    </p>
                    <div className="meta">
                      <span className="chip">
                        {circle.status === "full"
                          ? "Full"
                          : circle.status === "welcoming"
                            ? "Taking members"
                            : circle.status === "closed"
                              ? "Closed"
                              : "Forming"}
                      </span>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ) : null}

        {shown("groups") ? (
          <section className="band">
            <h2>Industry Groups</h2>
            <p className="muted small">
              Groups run across every Village, so a hotelier in Dubai and one
              in Lisbon are in the same room.
            </p>
            <div className="grid" style={{ marginTop: 16 }}>
              {(groups ?? [])
                .filter((g) => match(g.name, g.description))
                .map((group, i) => (
                  <article className="card" key={group.id}>
                    <div className={`cover ${covers[(i + 3) % covers.length]}`}>
                      {group.name}
                    </div>
                    <div className="kind">Across all Villages</div>
                    <p>{group.description}</p>
                    <div className="meta">
                      <span className="chip">Members only</span>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ) : null}

        {shown("events") ? (
          <section className="band">
            <h2>Events anyone can come to</h2>
            {(events ?? []).length === 0 ? (
              <p className="muted small">
                Nothing open to the public at the moment. Most of what happens
                here is for members.
              </p>
            ) : (
              <div className="grid" style={{ marginTop: 16 }}>
                {(events ?? [])
                  .filter((e) => match(e.title, e.description, e.venue))
                  .map((event, i) => (
                    <Link className="card" href={`/e/${event.slug}`} key={event.id}>
                      <div className={`cover ${covers[(i + 4) % covers.length]}`}>
                        {event.title}
                      </div>
                      <div className="kind">
                        {villageName(event.village_id) || "Online"}
                      </div>
                      <p>{whenText(event)}</p>
                      <div className="meta">
                        <span className="chip">
                          {event.is_online ? "Online" : event.venue ?? "In person"}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </section>
        ) : null}

        {shown("learning") ? (
          <section className="band">
            <h2>Learning</h2>
            <p className="muted small">
              Short courses written by members who have done the thing they are
              teaching. Taking one comes with membership.
            </p>
            <div className="grid" style={{ marginTop: 16 }}>
              {(courses ?? [])
                .filter((c) => match(c.title, c.summary))
                .map((course, i) => (
                  <article className="card" key={course.id}>
                    <div className={`cover ${covers[(i + 5) % covers.length]}`}>
                      {course.title}
                    </div>
                    <div className="kind">{course.duration ?? course.level}</div>
                    <p>{course.summary}</p>
                  </article>
                ))}
            </div>
          </section>
        ) : null}

        {shown("watch") ? (
          <section className="band">
            <h2>Watch and listen</h2>
            <div className="grid" style={{ marginTop: 16 }}>
              {(media ?? [])
                .filter((m) => match(m.title, m.summary))
                .map((item, i) => (
                  <Link className="card" href={`/watch/${item.slug}`} key={item.id}>
                    <div className={`cover ${covers[(i + 2) % covers.length]}`}>
                      {item.title}
                    </div>
                    <div className="kind">
                      {item.kind === "audio" ? "Podcast" : "Video"}
                      {item.duration ? `, ${item.duration}` : ""}
                    </div>
                    <p>{item.summary}</p>
                  </Link>
                ))}
            </div>
          </section>
        ) : null}

        <section className="band cta">
          <h2>ExpatPreneurs grows through introductions</h2>
          <p className="lead">
            Membership is by invitation and costs nothing. Somebody reads every
            request.
          </p>
          <p>
            <Link className="btn primary" href="/apply">
              Request an invitation
            </Link>{" "}
            <Link className="btn" href="/membership">
              What membership costs
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}