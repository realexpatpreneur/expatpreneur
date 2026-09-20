import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { LessonDone } from "../../forms";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson: position } = await params;
  const member = await requireMember("/learning");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, tier")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();
  if (course.tier === "paid" && !isPaid(member)) redirect(`/learning/${slug}`);

  const [{ data: lessons }, { data: enrolment }, { data: progress }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, position, title, body, video_url, duration")
        .eq("course_id", course.id)
        .order("position"),
      supabase
        .from("enrolments")
        .select("started_at")
        .eq("course_id", course.id)
        .eq("profile_id", member.id)
        .maybeSingle(),
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("profile_id", member.id),
    ]);

  if (!enrolment) redirect(`/learning/${slug}`);

  const current = (lessons ?? []).find((l) => String(l.position) === position);
  if (!current) notFound();

  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const next = (lessons ?? []).find((l) => l.position === current.position + 1);
  const previous = (lessons ?? []).find((l) => l.position === current.position - 1);

  return (
    <WorkspaceShell kind="member" nav="/learning">
        <section className="sec">
          <p className="muted small">
            <Link href={`/learning/${slug}`}>{course.title}</Link>
          </p>
          <h1>
            {current.position}. {current.title}
          </h1>
          {current.duration ? (
            <p className="lead">{current.duration}</p>
          ) : null}
          {current.video_url ? (
            <p>
              <a
                className="btn btn-primary"
                href={current.video_url}
                target="_blank"
                rel="noreferrer"
              >
                Watch the lesson
              </a>
            </p>
          ) : null}
        </section>

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {current.body || "Nothing written for this lesson yet."}
              </p>
            </div>

            <div className="stack">
              <div className="panel">
                <LessonDone
                  lessonId={current.id}
                  courseId={course.id}
                  slug={slug}
                  done={doneIds.has(current.id)}
                />
                <p className="muted small" style={{ marginTop: 12 }}>
                  {doneIds.size} of {(lessons ?? []).length} done.
                </p>
                <div className="row" style={{ marginTop: 12 }}>
                  {previous ? (
                    <Link className="btn btn-ghost" href={`/learning/${slug}/${previous.position}`}>
                      Previous
                    </Link>
                  ) : null}
                  {next ? (
                    <Link className="btn btn-ghost" href={`/learning/${slug}/${next.position}`}>
                      Next lesson
                    </Link>
                  ) : (
                    <Link className="btn btn-ghost" href={`/learning/${slug}`}>
                      Back to the course
                    </Link>
                  )}
                </div>
              </div>

              <div className="panel">
                <h3>Lessons</h3>
                <div className="divide" style={{ marginTop: 12 }}>
                  {(lessons ?? []).map((lesson) => (
                    <Link
                      className="li linkrow"
                      key={lesson.id}
                      href={`/learning/${slug}/${lesson.position}`}
                    >
                      <div>
                        <b>
                          {lesson.position}. {lesson.title}
                        </b>
                      </div>
                      <div className="rowmeta">
                        {doneIds.has(lesson.id) ? (
                          <span className="chip chip-mint">Done</span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}