import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import Link from "next/link";
import { Ic } from "@/components/icon";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { EnrolButton } from "../forms";
import { BuyButton, RefundForm } from "../buy";
import { Tick } from "@/components/design/parts";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string | null;
  duration: string | null;
  tier: string;
  price_cents: number;
  member_price_cents: number | null;
  currency: string | null;
  public_listing: boolean;
  status: string;
  educator_id?: string | null;
  format?: string | null;
  starts_at?: string | null;
  description?: string | null;
  outcomes?: string[] | null;
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await whoIsHere();
  const supabase = await createClient();

  // The columns a visitor is granted, or everything for a member. Asking
  // a visitor's query for a column they are not granted fails it, which
  // made every course a 404 for anybody signed out.
  const { data: found } = member
    ? await supabase.from("courses").select("*").eq("slug", slug).maybeSingle()
    : await supabase
        .from("courses")
        .select("id, slug, title, summary, level, duration, tier, price_cents, member_price_cents, currency, public_listing, status")
        .eq("slug", slug)
        .maybeSingle();
  const course = found as unknown as CourseRow | null;

  if (!course) notFound();
  if (!member && !course.public_listing) notFound();

  const locked = course.tier === "paid" && (!member || !isPaid(member));

  // What this reader would pay, and whether they have already.
  const priceCents = member
    ? course.member_price_cents ?? course.price_cents
    : course.price_cents;

  const money = (cents: number) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency: course.currency ?? "EUR",
      maximumFractionDigits: 0,
    });

  const { data: bought } = member
    ? await supabase
        .from("course_purchases")
        .select("id, created_at")
        .eq("course_id", course.id)
        .eq("profile_id", member.id)
        .eq("status", "paid")
        .maybeSingle()
    : { data: null };

  const paidFor = priceCents === 0 || Boolean(bought);

  const [
    { data: lessons },
    { data: enrolment },
    { data: educator },
    { data: teaching },
    { data: progress },
  ] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, position, title, duration")
        .eq("course_id", course.id)
        .order("position"),
      member
        ? supabase
            .from("enrolments")
            .select("started_at, completed_at")
            .eq("course_id", course.id)
            .eq("profile_id", member.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      course.educator_id
        ? supabase
            .from("profiles")
            .select("id, full_name, headline")
            .eq("id", course.educator_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      course.educator_id
        ? supabase
            .from("educator_profiles")
            .select("headline, about, teaches_in, markets")
            .eq("profile_id", course.educator_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      member
        ? supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
    ]);

  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    const label = {
      fontSize: 13,
      fontWeight: 700,
      border: "1px solid #C7CDD4",
      borderRadius: 4,
      padding: "6px 10px",
    };
    const detail = {
      display: "grid",
      gridTemplateColumns: "minmax(0,180px) minmax(0,1fr)",
      gap: 20,
      padding: "16px 0",
      borderBottom: "1px solid #E3E6EA",
    };

    return (
      <PublicPage active="/learning">
        <div className="d-page">
          <section style={{ padding: "48px 0 72px" }}>
            <div className="d-wrap">
              <p className="d-small">
                <Link href="/learning">Learning</Link>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 24 }}>
                {course.level ? <span style={label}>{course.level}</span> : null}
                {course.duration ? <span style={label}>{course.duration}</span> : null}
                {course.tier === "paid" ? (
                  <span style={{ ...label, borderColor: "#F2A65A", color: "#8A5520" }}>Village Membership</span>
                ) : null}
              </div>
              <h1 className="d-h1" style={{ marginTop: 22, maxWidth: "22ch" }}>{course.title}</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch" }}>{course.summary}</p>
            </div>
          </section>

          <section className="d-sec d-sec-top0">
            <div className="d-wrap d-apply">
              <div>
                {(course.outcomes ?? []).length ? (
                  <div>
                    <h2 className="d-h2">You will learn to</h2>
                    <ul className="d-ticks">
                      {(course.outcomes as string[]).map((outcome) => (
                        <li key={outcome}>
                          <Tick />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p
                  className="d-lead"
                  style={{ whiteSpace: "pre-wrap", marginTop: (course.outcomes ?? []).length ? 44 : 0 }}
                >
                  {course.description}
                </p>

                <h2 className="d-h2" style={{ marginTop: 52 }}>The detail</h2>
                <dl style={{ marginTop: 20, borderTop: "2px solid #0F1419" }}>
                  <div style={detail}>
                    <dt className="d-small">When</dt>
                    <dd className="d-body" style={{ margin: 0 }}>
                      {course.format === "live"
                        ? course.starts_at
                          ? new Date(course.starts_at).toLocaleString("en-GB", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "A live workshop, date to be set"
                        : "Recorded, taken whenever you like"}
                    </dd>
                  </div>
                  <div style={detail}>
                    <dt className="d-small">For</dt>
                    <dd className="d-body" style={{ margin: 0 }}>{course.level}</dd>
                  </div>
                  <div style={detail}>
                    <dt className="d-small">How long</dt>
                    <dd className="d-body" style={{ margin: 0 }}>{course.duration ?? "Not said"}</dd>
                  </div>
                </dl>
                <p className="d-small" style={{ marginTop: 16 }}>
                  Refunds up to 48 hours before a live session.
                </p>

                <h2 className="d-h2" style={{ marginTop: 56 }}>{(lessons ?? []).length} lessons</h2>
                {(lessons ?? []).length === 0 ? (
                  <p className="d-body" style={{ marginTop: 14 }}>Still being written.</p>
                ) : (
                  <div className="d-rows" style={{ marginTop: 22 }}>
                    {(lessons ?? []).map((lesson) => (
                      <Link
                        className="d-row"
                        key={lesson.id}
                        href={
                          enrolment && !locked && paidFor
                            ? `/learning/${slug}/${lesson.position}`
                            : `/learning/${slug}`
                        }
                        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 20, alignItems: "center" }}
                      >
                        <span>
                          <b style={{ display: "block", fontSize: 17 }}>
                            {lesson.position}. {lesson.title}
                          </b>
                          {lesson.duration ? (
                            <span className="d-small" style={{ display: "block", marginTop: 4, fontSize: 13 }}>
                              {lesson.duration}
                            </span>
                          ) : null}
                        </span>
                        <span>
                          {doneIds.has(lesson.id) ? (
                            <span className="d-status d-open" style={{ fontSize: 13 }}>Done</span>
                          ) : null}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="d-boxed d-form">
                  <h2 className="d-h2">{priceCents === 0 ? "Free" : money(priceCents)}</h2>
                  <p className="d-body" style={{ marginTop: 12 }}>
                    {priceCents === 0
                      ? "Free, but you need an account to take it."
                      : "Anyone can buy this. Members pay the member price."}
                  </p>
                  {priceCents === 0 ? (
                    <Link className="d-btn d-btn-dark d-shine d-btn-wide" href="/apply" style={{ marginTop: 24 }}>
                      Request an invitation
                    </Link>
                  ) : (
                    <>
                      <BuyButton slug={slug} label={`Buy it, ${money(priceCents)}`} />
                      <p className="d-small" style={{ marginTop: 16 }}>
                        You will get it by email. Members take it inside the
                        platform, with everything else.
                      </p>
                    </>
                  )}
                </div>

                {educator ? (
                  <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid #E3E6EA" }}>
                    <h2 className="d-h2" style={{ fontSize: 22 }}>Taught by</h2>
                    <p className="d-body" style={{ marginTop: 12 }}>
                      {educator.full_name}
                      {teaching?.headline
                        ? `, ${teaching.headline}`
                        : educator.headline
                          ? `, ${educator.headline}`
                          : ""}
                    </p>
                    {teaching?.about ? (
                      <p className="d-body" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
                        {teaching.about}
                      </p>
                    ) : null}
                    {(teaching?.markets ?? []).length ? (
                      <p className="d-small" style={{ marginTop: 12 }}>
                        Knows {(teaching?.markets ?? []).join(", ")}.
                      </p>
                    ) : null}
                    {(teaching?.teaches_in ?? []).length ? (
                      <p className="d-small" style={{ marginTop: 6 }}>
                        Teaches in {(teaching?.teaches_in ?? []).join(", ")}.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/learning" active="/learning">
        <section className="sec">
          <p className="muted small">
            <Link href="/learning">Learning</Link>
          </p>
          <p>
            <span className="chip">{course.level}</span>{" "}
            {course.duration ? <span className="chip">{course.duration}</span> : null}{" "}
            {course.tier === "paid" ? (
              <span className="chip chip-sun">Village Membership</span>
            ) : null}
          </p>
          <h1>{course.title}</h1>
          <p className="lead">{course.summary}</p>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {(course.outcomes ?? []).length ? (
                <div className="panel">
                  <h3>You will learn to</h3>
                  <ul className="ticks" style={{ marginTop: 12 }}>
                    {(course.outcomes as string[]).map((outcome) => (
                      <li key={outcome}>
                        <Ic name="check" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {course.description}
                </p>
              </div>

              <div className="panel">
                <h3>The detail</h3>
                <dl className="kv">
                  <dt>When</dt>
                  <dd>
                    {course.format === "live"
                      ? course.starts_at
                        ? new Date(course.starts_at).toLocaleString("en-GB", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "A live workshop, date to be set"
                      : "Recorded, taken whenever you like"}
                  </dd>
                  <dt>For</dt>
                  <dd>{course.level}</dd>
                  <dt>How long</dt>
                  <dd>{course.duration ?? "Not said"}</dd>
                </dl>
                <p className="muted small" style={{ marginTop: 12 }}>
                  Refunds up to 48 hours before a live session.
                </p>
              </div>

              <div className="panel">
                <h3>{(lessons ?? []).length} lessons</h3>
                {(lessons ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Still being written.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(lessons ?? []).map((lesson) => (
                      <Link
                        className="li linkrow"
                        key={lesson.id}
                        href={
                          enrolment && !locked && paidFor
                            ? `/learning/${slug}/${lesson.position}`
                            : `/learning/${slug}`
                        }
                      >
                        <div>
                          <b>
                            {lesson.position}. {lesson.title}
                          </b>
                          {lesson.duration ? (
                            <div className="muted small">{lesson.duration}</div>
                          ) : null}
                        </div>
                        <div className="rowmeta">
                          {doneIds.has(lesson.id) ? (
                            <span className="chip chip-mint">Done</span>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              {bought ? (
                <div className="panel panel-wash">
                  <h3>You bought this</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    If it was not what you expected, say so. Refunds are
                    handled by the Global team, not by the educator.
                  </p>
                  <RefundForm purchaseId={bought.id} slug={slug} />
                </div>
              ) : null}

              <div className="panel">
                {!member ? (
                  <>
                    <h3>
                      {priceCents === 0 ? "Free" : money(priceCents)}
                    </h3>
                    <p className="muted small" style={{ marginTop: 8 }}>
                      {priceCents === 0
                        ? "Free, but you need an account to take it."
                        : "Anyone can buy this. Members pay the member price."}
                    </p>
                    {priceCents === 0 ? (
                      <Link className="btn btn-primary" href="/apply">
                        Request an invitation
                      </Link>
                    ) : (
                      <>
                        <BuyButton slug={slug} label={`Buy it, ${money(priceCents)}`} />
                        <p className="muted small" style={{ marginTop: 12 }}>
                          You will get it by email. Members take it inside the
                          platform, with everything else.
                        </p>
                      </>
                    )}
                  </>
                ) : !paidFor ? (
                  <>
                    <h3>{money(priceCents)}</h3>
                    <p className="muted small" style={{ marginTop: 8 }}>
                      {course.member_price_cents !== null &&
                      course.member_price_cents < course.price_cents
                        ? `The member price. Others pay ${money(course.price_cents)}.`
                        : "Yours once you buy it, for good."}
                    </p>
                    <BuyButton slug={slug} label="Buy this course" />
                  </>
                ) : locked ? (
                  <>
                    <h3>Part of Village Membership</h3>
                    <p className="muted small" style={{ marginTop: 8 }}>
                      Some courses come with Village Membership, along with the
                      rest of the network.
                    </p>
                    <Link className="btn btn-ghost" href="/upgrade">
                      See Village Membership
                    </Link>
                  </>
                ) : enrolment ? (
                  <>
                    <h3>
                      {enrolment.completed_at ? "You finished this" : "You are in"}
                    </h3>
                    <p className="muted small" style={{ marginTop: 8 }}>
                      {enrolment.completed_at
                        ? "Go back to any lesson whenever you need it."
                        : "Pick up where you left off."}
                    </p>
                    {(lessons ?? []).length ? (
                      <Link
                        className="btn btn-primary"
                        href={`/learning/${slug}/${
                          (lessons ?? []).find((l) => !doneIds.has(l.id))?.position ??
                          1
                        }`}
                      >
                        {enrolment.completed_at ? "Open it" : "Continue"}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <EnrolButton courseId={course.id} slug={slug} />
                )}
              </div>

              {educator ? (
                <div className="panel">
                  <h3>Taught by</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    {member ? (
                      <Link href={`/members/${educator.id}`}>
                        {educator.full_name}
                      </Link>
                    ) : (
                      educator.full_name
                    )}
                    {teaching?.headline
                      ? `, ${teaching.headline}`
                      : educator.headline
                        ? `, ${educator.headline}`
                        : ""}
                  </p>
                  {teaching?.about ? (
                    <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                      {teaching.about}
                    </p>
                  ) : null}
                  {(teaching?.markets ?? []).length ? (
                    <p className="muted small">
                      Knows {(teaching?.markets ?? []).join(", ")}.
                    </p>
                  ) : null}
                  {(teaching?.teaches_in ?? []).length ? (
                    <p className="muted small">
                      Teaches in {(teaching?.teaches_in ?? []).join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </DualPage>
  );
}