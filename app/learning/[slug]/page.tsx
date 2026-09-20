import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { EnrolButton } from "../forms";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await requireMember("/learning");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();

  const locked = course.tier === "paid" && !isPaid(member);

  const [{ data: lessons }, { data: enrolment }, { data: educator }, { data: progress }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, position, title, duration")
        .eq("course_id", course.id)
        .order("position"),
      supabase
        .from("enrolments")
        .select("started_at, completed_at")
        .eq("course_id", course.id)
        .eq("profile_id", member.id)
        .maybeSingle(),
      course.educator_id
        ? supabase
            .from("profiles")
            .select("id, full_name, headline")
            .eq("id", course.educator_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("profile_id", member.id),
    ]);

  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));

  return (
    <>
      <SiteHeader signedIn />
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
                          enrolment && !locked
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
              <div className="panel">
                {locked ? (
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
                    <Link href={`/members/${educator.id}`}>
                      {educator.full_name}
                    </Link>
                    {educator.headline ? `, ${educator.headline}` : ""}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}