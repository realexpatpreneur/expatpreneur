import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { CourseForm, LessonForm, DeleteLessonButton } from "../forms";

export default async function EducatorCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { slug } = await params;
  const { done } = await searchParams;
  const member = await requireMember("/educator");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();

  const [{ data: lessons }, { data: enrolments }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("position"),
    supabase
      .from("course_progress")
      .select("profile_id, lessons, done")
      .eq("course_id", course.id),
  ]);

  const mine = course.educator_id === member.id;
  const finished = (enrolments ?? []).filter(
    (e) => e.lessons > 0 && e.done >= e.lessons
  ).length;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/educator">Your courses</Link>
          </p>
          <h1>{course.title}</h1>
          <p className="lead">
            {(lessons ?? []).length} lessons. {(enrolments ?? []).length} members
            started it, {finished} finished.
          </p>
          {done ? <div className="notice good">Saved.</div> : null}
          {!mine ? (
            <div className="notice bad">
              This course belongs to someone else, so saving will be refused.
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              {(lessons ?? []).map((lesson) => (
                <div key={lesson.id}>
                  <LessonForm
                    courseId={course.id}
                    nextPosition={lesson.position}
                    lesson={lesson}
                  />
                  {mine ? (
                    <DeleteLessonButton id={lesson.id} courseId={course.id} />
                  ) : null}
                </div>
              ))}
              <LessonForm
                courseId={course.id}
                nextPosition={(lessons ?? []).length + 1}
              />
            </div>
            <CourseForm course={course} />
          </div>
        </section>
      </main>
    </>
  );
}