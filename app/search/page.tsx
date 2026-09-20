import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { whenText } from "@/lib/events";

export const metadata = { title: "Search, ExpatPreneurs Global" };

type Hit = {
  href: string;
  title: string;
  line: string;
  where: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  await requireMember("/search");
  const supabase = await createClient();
  const term = q.trim();

  // Every query runs as the member, so the access rules do the filtering.
  // Nothing appears here that they could not open anyway.
  const hits: Hit[] = [];

  if (term.length >= 2) {
    const like = `%${term}%`;

    const [
      people,
      businesses,
      posts,
      markets,
      events,
      resources,
      courses,
      pathways,
      groups,
      jobs,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, headline, business_name, industry")
        .eq("status", "active")
        .or(
          `full_name.ilike.${like},headline.ilike.${like},business_name.ilike.${like},industry.ilike.${like},can_help_with.ilike.${like}`
        )
        .limit(8),
      supabase
        .from("businesses")
        .select("slug, name, tagline, industry")
        .or(`name.ilike.${like},tagline.ilike.${like},industry.ilike.${like}`)
        .limit(6),
      supabase
        .from("asks")
        .select("id, title, body, kind, status")
        .or(`title.ilike.${like},body.ilike.${like}`)
        .limit(6),
      supabase
        .from("market_posts")
        .select("id, title, country, industry")
        .or(`title.ilike.${like},country.ilike.${like},industry.ilike.${like}`)
        .limit(6),
      supabase
        .from("events")
        .select("slug, title, starts_at, ends_at, timezone, venue")
        .eq("status", "published")
        .or(`title.ilike.${like},description.ilike.${like},venue.ilike.${like}`)
        .limit(6),
      supabase
        .from("resources")
        .select("id, title, description, url, kind")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(6),
      supabase
        .from("courses")
        .select("slug, title, summary")
        .eq("status", "published")
        .or(`title.ilike.${like},summary.ilike.${like}`)
        .limit(4),
      supabase
        .from("market_pathways")
        .select("slug, title, country, summary")
        .eq("status", "published")
        .or(`title.ilike.${like},country.ilike.${like},summary.ilike.${like}`)
        .limit(4),
      supabase
        .from("industry_groups")
        .select("slug, name, industry")
        .or(`name.ilike.${like},industry.ilike.${like}`)
        .limit(4),
      supabase
        .from("jobs")
        .select("id, title, kind, location")
        .eq("status", "open")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(6),
    ]);

    for (const person of people.data ?? []) {
      hits.push({
        href: `/members/${person.id}`,
        title: person.full_name,
        line: person.headline || person.business_name || "Member",
        where: "Member",
      });
    }
    for (const business of businesses.data ?? []) {
      hits.push({
        href: `/businesses/${business.slug}`,
        title: business.name,
        line: business.tagline ?? business.industry ?? "",
        where: "Business",
      });
    }
    for (const post of posts.data ?? []) {
      hits.push({
        href: `/village/${post.id}`,
        title: post.title,
        line: post.body?.slice(0, 90) ?? "",
        where: post.kind === "offer" ? "Offer" : "Ask",
      });
    }
    for (const market of markets.data ?? []) {
      hits.push({
        href: `/market-exploration/${market.id}`,
        title: market.title,
        line: `${market.country}. ${market.industry}`,
        where: "Market Exploration",
      });
    }
    for (const event of events.data ?? []) {
      hits.push({
        href: `/events/${event.slug}`,
        title: event.title,
        line: whenText(event),
        where: "Event",
      });
    }
    for (const resource of resources.data ?? []) {
      hits.push({
        href: "/library",
        title: resource.title,
        line: resource.description ?? "",
        where: "Resource",
      });
    }
    for (const course of courses.data ?? []) {
      hits.push({
        href: `/learning/${course.slug}`,
        title: course.title,
        line: course.summary ?? "",
        where: "Course",
      });
    }
    for (const pathway of pathways.data ?? []) {
      hits.push({
        href: `/markets/${pathway.slug}`,
        title: pathway.title,
        line: `${pathway.country}. ${pathway.summary ?? ""}`,
        where: "Market pathway",
      });
    }
    for (const group of groups.data ?? []) {
      hits.push({
        href: `/groups/${group.slug}`,
        title: group.name,
        line: group.industry,
        where: "Industry Group",
      });
    }
    for (const job of jobs.data ?? []) {
      hits.push({
        href: `/jobs/${job.id}`,
        title: job.title,
        line: job.location ?? "",
        where: job.kind === "job" ? "Hiring" : "Freelance",
      });
    }
  }

  return (
    <WorkspaceShell kind="member" nav="/search">
        <section className="sec">
          <h1>Search</h1>
          <p className="lead">
            Members, businesses, posts, events, resources and courses. You only
            ever see what you could open anyway.
          </p>
          <form className="searchrow">
            <input
              name="q"
              defaultValue={q}
              placeholder="A name, a country, a trade, anything"
              autoFocus
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
        </section>

        <section className="sec">
          {term.length < 2 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Two letters or more.
              </p>
            </div>
          ) : hits.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing matches that. Try a shorter word, or ask in your
                Village.
              </p>
              <Link className="btn btn-ghost" href="/village/new">
                Post an ask
              </Link>
            </div>
          ) : (
            <>
              <p className="muted small">
                {hits.length} {hits.length === 1 ? "result" : "results"}
              </p>
              <div className="divide">
                {hits.map((hit, i) => (
                  <Link className="li linkrow" key={`${hit.href}-${i}`} href={hit.href}>
                    <div>
                      <b>{hit.title}</b>
                      <div className="muted small">{hit.line}</div>
                    </div>
                    <div className="rowmeta">
                      <span className="chip">{hit.where}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </WorkspaceShell>
  );
}