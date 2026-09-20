import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid, timeAgo } from "@/lib/member";
import { whenText } from "@/lib/events";

export const metadata = { title: "For you, ExpatPreneurs Global" };

const overlap = (a: string[] | null, b: string[] | null) =>
  (a ?? []).filter((item) =>
    (b ?? []).some((other) => other.toLowerCase() === item.toLowerCase())
  );

export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "people" } = await searchParams;
  const member = await requireMember("/for-you");
  const supabase = await createClient();

  const { data: mine } = await supabase
    .from("profiles")
    .select("industry, markets_known, lived_in, languages, looking_for, can_help_with")
    .eq("id", member.id)
    .maybeSingle();

  const myMarkets = [...(mine?.markets_known ?? []), ...(mine?.lived_in ?? [])];

  // Everything below runs as this member, so the access rules do the
  // narrowing: a free member sees their own Village, a paid member sees the
  // network. Nothing here reaches further than the Directory already does.
  const [
    { data: people },
    { data: villages },
    { data: asks },
    { data: marketPosts },
    { data: jobs },
    { data: events },
    { data: pods },
    { data: myGroups },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, business_name, industry, markets_known, lived_in, village_id, avatar_url")
      .eq("status", "active")
      .neq("id", member.id)
      .limit(150),
    supabase.from("villages").select("id, name"),
    supabase
      .from("asks")
      .select("id, title, body, kind, category, author_id, village_id, created_at")
      .eq("status", "open")
      .neq("author_id", member.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("market_posts")
      .select("id, title, country, city, industry, author_id, created_at")
      .eq("status", "open")
      .neq("author_id", member.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("jobs")
      .select("id, title, location, remote, kind, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online, village_id")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(20),
    supabase
      .from("pods")
      .select("id, slug, name, purpose, cadence, village_id, status")
      .eq("status", "forming")
      .limit(10),
    supabase.from("group_members").select("group_id").eq("profile_id", member.id),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  // Why somebody is worth meeting, in the member's own words rather than a
  // score they cannot see.
  const suggestions = (people ?? [])
    .map((person) => {
      const reasons: string[] = [];

      if (
        mine?.industry &&
        person.industry &&
        person.industry.toLowerCase() === mine.industry.toLowerCase()
      ) {
        reasons.push(`Also in ${person.industry}`);
      }

      const markets = overlap(
        [...(person.markets_known ?? []), ...(person.lived_in ?? [])],
        myMarkets
      );
      if (markets.length) {
        reasons.push(`Knows ${markets.slice(0, 2).join(" and ")}`);
      }

      if (person.village_id !== member.village_id && person.village_id) {
        reasons.push(`In ${villageName(person.village_id)}`);
      }

      return { person, reasons };
    })
    .filter((row) => row.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .slice(0, 9);

  // An opening is worth showing when it touches something the member said
  // about themselves.
  const asksForMe = (asks ?? []).filter((ask) => {
    const text = `${ask.title} ${ask.body} ${ask.category ?? ""}`.toLowerCase();
    return (
      (mine?.industry && text.includes(mine.industry.toLowerCase())) ||
      myMarkets.some((m) => m && text.includes(m.toLowerCase())) ||
      ask.village_id === member.village_id
    );
  });

  const marketsForMe = (marketPosts ?? []).filter((post) =>
    myMarkets.some(
      (m) =>
        m &&
        (post.country?.toLowerCase().includes(m.toLowerCase()) ||
          post.city?.toLowerCase().includes(m.toLowerCase()))
    ) ||
    (mine?.industry &&
      post.industry?.toLowerCase() === mine.industry.toLowerCase())
  );

  const tabs = [
    ["people", "People"],
    ["openings", "Openings"],
    ["how", "How this is worked out"],
  ] as const;

  return (
    <WorkspaceShell kind="member" nav="/for-you">
        <section className="sec">
          <h1>For you</h1>
          <p className="lead">
            People and openings worth a few minutes, picked from what you
            wrote about yourself and what is happening this week.
          </p>
          <div className="tabs">
            {tabs.map(([key, label]) => (
              <Link
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/for-you?show=${key}`}
                key={key}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {show === "people" ? (
          <section className="sec">
            {suggestions.length === 0 ? (
              <div className="panel">
                <h3>Nothing to suggest yet</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  This works from your industry, the markets you know and
                  where you have lived. Filling those in on your profile is
                  what makes it useful.
                </p>
                <Link className="btn btn-ghost" href="/settings">
                  Fill in your profile
                </Link>
              </div>
            ) : (
              <div className="g3 g4">
                {suggestions.map(({ person, reasons }) => (
                  <Link className="card" href={`/members/${person.id}`} key={person.id}>
                    {person.avatar_url ? (
                      <div className="cover photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={person.avatar_url} alt="" />
                      </div>
                    ) : (
                      <div className="cover blue">
                        {person.full_name
                          .split(" ")
                          .map((part: string) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                    <div className="kind">{reasons[0]}</div>
                    <p>
                      <b>{person.full_name}</b>
                      {person.headline ? `. ${person.headline}` : ""}
                    </p>
                    <div className="meta">
                      {reasons.slice(1).map((reason) => (
                        <span className="chip" key={reason}>
                          {reason}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {isPaid(member) ? null : (
              <div className="panel panel-wash" style={{ marginTop: 20 }}>
                <h3>These are people in your own Village</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  On the paid plan the same page suggests people in every
                  Village, which is where the markets you do not know yet are.
                </p>
                <Link className="btn btn-ghost" href="/upgrade">
                  See the paid plan
                </Link>
              </div>
            )}
          </section>
        ) : null}

        {show === "openings" ? (
          <section className="sec">
            <div className="stack">
              <div className="panel">
                <h3>Asks you could answer</h3>
                {asksForMe.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing open that touches what you do.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {asksForMe.slice(0, 6).map((ask) => (
                      <Link className="li linkrow" href={`/village/${ask.id}`} key={ask.id}>
                        <div>
                          <b>{ask.title}</b>
                          <div className="muted small">
                            {ask.kind === "offer" ? "An offer" : "An ask"}.{" "}
                            {timeAgo(ask.created_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Markets you know</h3>
                {marketsForMe.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody is asking about the markets on your profile at the
                    moment.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {marketsForMe.slice(0, 6).map((post) => (
                      <Link
                        className="li linkrow"
                        href={`/market-exploration/${post.id}`}
                        key={post.id}
                      >
                        <div>
                          <b>{post.title}</b>
                          <div className="muted small">
                            {post.city ? `${post.city}, ` : ""}
                            {post.country}. {timeAgo(post.created_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Coming up</h3>
                {(events ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing on the calendar you can get to yet.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(events ?? []).slice(0, 5).map((event) => (
                      <Link
                        className="li linkrow"
                        href={`/events/${event.slug}`}
                        key={event.id}
                      >
                        <div>
                          <b>{event.title}</b>
                          <div className="muted small">
                            {whenText(event)}.{" "}
                            {villageName(event.village_id) ||
                              (event.is_online ? "Online" : "")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {(pods ?? []).length ? (
                <div className="panel">
                  <h3>Pods forming</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    A few members working towards something together, for a
                    fixed stretch.
                  </p>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(pods ?? []).map((pod) => (
                      <Link className="li linkrow" href={`/pods/${pod.slug}`} key={pod.id}>
                        <div>
                          <b>{pod.name}</b>
                          <div className="muted small">
                            {pod.purpose ?? ""} {pod.cadence}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {(jobs ?? []).length ? (
                <div className="panel">
                  <h3>Who is hiring</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(jobs ?? []).slice(0, 5).map((job) => (
                      <Link className="li linkrow" href={`/jobs/${job.id}`} key={job.id}>
                        <div>
                          <b>{job.title}</b>
                          <div className="muted small">
                            {job.remote ? "Remote" : job.location ?? ""}.{" "}
                            {timeAgo(job.created_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {show === "how" ? (
          <section className="sec">
            <div className="gside">
              <div className="panel">
                <h3>Where these come from</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Three things you wrote on your profile: your industry, the
                  markets you know, and where you have lived. A person is
                  suggested when one of those matches theirs, and the card
                  says which one, so you can judge it rather than trust it.
                </p>
                <dl className="kv">
                  <dt>Your industry</dt>
                  <dd>{mine?.industry || "Not given"}</dd>
                  <dt>Markets you know</dt>
                  <dd>{(mine?.markets_known ?? []).join(", ") || "Not given"}</dd>
                  <dt>Where you have lived</dt>
                  <dd>{(mine?.lived_in ?? []).join(", ") || "Not given"}</dd>
                  <dt>Groups you are in</dt>
                  <dd>{(myGroups ?? []).length}</dd>
                </dl>
                <Link className="btn btn-ghost" href="/settings">
                  Change any of this
                </Link>
              </div>

              <div className="stack">
                <div className="panel panel-wash">
                  <h3>What it does not do</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    It does not watch what you read, who you looked at or how
                    long you stayed. Nothing here is learned about you behind
                    your back; it is your own profile, read back.
                  </p>
                </div>
                <div className="panel panel-wash">
                  <h3>Who can see you here</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    The same people who can see you in the Directory, and no
                    others. Suggestions never reach past the access rules.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </WorkspaceShell>
  );
}