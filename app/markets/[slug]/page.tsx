import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { FollowForm, StepDone } from "../forms";

export default async function PathwayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/markets");
  const supabase = await createClient();

  const { data: pathway } = await supabase
    .from("market_pathways")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!pathway) notFound();

  const locked = pathway.tier === "paid" && !isPaid(member);

  const [{ data: steps }, { data: follow }, { data: progress }] =
    await Promise.all([
      supabase
        .from("pathway_steps")
        .select("*")
        .eq("pathway_id", pathway.id)
        .order("position"),
      supabase
        .from("pathway_followers")
        .select("started_at")
        .eq("pathway_id", pathway.id)
        .eq("profile_id", member.id)
        .maybeSingle(),
      supabase
        .from("pathway_step_progress")
        .select("step_id")
        .eq("profile_id", member.id),
    ]);

  // Who already knows this market, and what is being asked about it.
  const [{ data: knowers }, { data: questions }, { data: sellers }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, headline, village_id")
        .eq("status", "active")
        .contains("markets_known", [pathway.country])
        .limit(12),
      supabase
        .from("market_posts")
        .select("id, title, stage")
        .eq("country", pathway.country)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("businesses")
        .select("id, slug, name, tagline")
        .contains("serves", [pathway.country])
        .limit(6),
    ]);

  const doneIds = new Set((progress ?? []).map((p) => p.step_id));

  return (
    <WorkspaceShell kind="member" nav="/markets">
        <section className="sec">
          <p className="muted small">
            <Link href="/markets">Market pathways</Link>
          </p>
          <p>
            <span className="chip chip-blue">
              {pathway.city ? `${pathway.city}, ` : ""}
              {pathway.country}
            </span>{" "}
            {pathway.industry ? (
              <span className="chip">{pathway.industry}</span>
            ) : null}{" "}
            {pathway.tier === "paid" ? (
              <span className="chip chip-sun">Paid plan</span>
            ) : null}
          </p>
          <h1>{pathway.title}</h1>
          <p className="lead">{pathway.summary}</p>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {pathway.body ? (
                <div className="panel">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{pathway.body}</p>
                </div>
              ) : null}

              {locked ? (
                <div className="panel panel-wash">
                  <h3>The steps are part of the paid plan</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    What a pathway is worth is the detail: the order, the costs,
                    the things people get wrong. That comes with paid
                    membership.
                  </p>
                  <Link className="btn btn-ghost" href="/upgrade">
                    See the paid plan
                  </Link>
                </div>
              ) : (
                <div className="stack">
                  {(steps ?? []).length === 0 ? (
                    <div className="panel panel-wash">
                      <p className="muted" style={{ margin: 0 }}>
                        The steps are still being written.
                      </p>
                    </div>
                  ) : (
                    (steps ?? []).map((step) => (
                      <div className="panel" key={step.id}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <h3>
                            {step.position}. {step.title}
                          </h3>
                          {doneIds.has(step.id) ? (
                            <span className="chip chip-mint">Done</span>
                          ) : null}
                        </div>
                        {step.body ? (
                          <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                            {step.body}
                          </p>
                        ) : null}
                        {step.watch_out ? (
                          <div className="flag hold">
                            What people get wrong: {step.watch_out}
                          </div>
                        ) : null}
                        <dl className="kv">
                          <dt>Usually costs</dt>
                          <dd>{step.typical_cost || "Varies"}</dd>
                          <dt>Usually takes</dt>
                          <dd>{step.typical_time || "Varies"}</dd>
                        </dl>
                        <div className="row" style={{ marginTop: 12 }}>
                          {step.link ? (
                            <a
                              className="btn btn-ghost"
                              href={step.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open the link
                            </a>
                          ) : null}
                          {follow ? (
                            <StepDone
                              stepId={step.id}
                              slug={slug}
                              done={doneIds.has(step.id)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="stack">
              {!locked && !follow ? (
                <div className="panel">
                  <FollowForm
                    pathwayId={pathway.id}
                    slug={slug}
                    country={pathway.country}
                  />
                </div>
              ) : null}

              <div className="panel">
                <h3>Members who know {pathway.country}</h3>
                {(knowers ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nobody has listed it yet. Ask in Market Exploration and
                    someone usually turns up.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(knowers ?? []).map((person) => (
                      <Link
                        className="li linkrow"
                        key={person.id}
                        href={`/members/${person.id}`}
                      >
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">{person.headline}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {(sellers ?? []).length ? (
                <div className="panel">
                  <h3>Members already selling there</h3>
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(sellers ?? []).map((business) => (
                      <Link
                        className="li linkrow"
                        key={business.id}
                        href={`/businesses/${business.slug}`}
                      >
                        <div>
                          <b>{business.name}</b>
                          <div className="muted small">{business.tagline}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="panel panel-wash">
                <h3>Open questions about {pathway.country}</h3>
                {(questions ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    None at the moment.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(questions ?? []).map((question) => (
                      <Link
                        className="li linkrow"
                        key={question.id}
                        href={`/market-exploration/${question.id}`}
                      >
                        <div>
                          <b>{question.title}</b>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link className="btn btn-ghost" href="/market-exploration/new">
                  Ask your own
                </Link>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}