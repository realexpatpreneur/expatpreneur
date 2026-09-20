import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EnrolButton } from "../forms";
import { BuyButton, RefundForm } from "../buy";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

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

  return (
    <>
      <SiteHeader signedIn={Boolean(member)} />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/learning">Learning</Link>
          </p>
          <p>
            <span className="chip">{course.level}</span>{" "}
            {course.duration ? <span className="chip">{course.duration}</span> : null}{" "}
            {course.tier === "paid" ? (
              <span className="chip sun">Paid plan</span>
            ) : null}
          </p>
          <h1>{course.title}</h1>
          <p className="lead">{course.summary}</p>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {course.description}
                </p>
              </div>

              <div className="panel">
                <h3>{(lessons ?? []).length} lessons</h3>
                {(lessons ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Still being written.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(lessons ?? []).map((lesson) => (
                      <Link
                        className="rowlink"
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
                            <span className="chip mint">Done</span>
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
                <div className="panel wash">
                  <h3>You bought this</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
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
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {priceCents === 0
                        ? "Free, but you need an account to take it."
                        : "Anyone can buy this. Members pay the member price."}
                    </p>
                    {priceCents === 0 ? (
                      <Link className="btn primary" href="/apply">
                        Request an invitation
                      </Link>
                    ) : (
                      <>
                        <BuyButton slug={slug} label={`Buy it, ${money(priceCents)}`} />
                        <p className="muted small" style={{ marginTop: 10 }}>
                          You will get it by email. Members take it inside the
                          platform, with everything else.
                        </p>
                      </>
                    )}
                  </>
                ) : !paidFor ? (
                  <>
                    <h3>{money(priceCents)}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {course.member_price_cents !== null &&
                      course.member_price_cents < course.price_cents
                        ? `The member price. Others pay ${money(course.price_cents)}.`
                        : "Yours once you buy it, for good."}
                    </p>
                    <BuyButton slug={slug} label="Buy this course" />
                  </>
                ) : locked ? (
                  <>
                    <h3>Part of the paid plan</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Some courses come with paid membership, along with the
                      rest of the network.
                    </p>
                    <Link className="btn" href="/upgrade">
                      See the paid plan
                    </Link>
                  </>
                ) : enrolment ? (
                  <>
                    <h3>
                      {enrolment.completed_at ? "You finished this" : "You are in"}
                    </h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {enrolment.completed_at
                        ? "Go back to any lesson whenever you need it."
                        : "Pick up where you left off."}
                    </p>
                    {(lessons ?? []).length ? (
                      <Link
                        className="btn primary"
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
                  <p className="muted small" style={{ marginTop: 6 }}>
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
      </main>
      {member ? null : <SiteFooter />}
    </>
  );
}