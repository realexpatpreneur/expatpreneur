import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { Stat } from "@/components/admin-bits";
import { Ic } from "@/components/icon";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { CourseForm } from "./forms";

export const metadata = { title: "Educator, ExpatPreneurs Global" };

export default async function EducatorPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const member = await requireMember("/educator");
  const supabase = await createClient();

  const [{ data: courses }, { data: roles }] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("educator_id", member.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_roles")
      .select("role")
      .eq("profile_id", member.id)
      .is("ended_at", null),
  ]);

  const isEducator = (roles ?? []).some((r) =>
    ["educator", "global_admin"].includes(r.role)
  );

  // Real figures rather than placeholders: how many people are taking
  // these courses, and what has been bought this month.
  const courseIds = (courses ?? []).map((c) => c.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ count: learners }, { count: sales }] = courseIds.length
    ? await Promise.all([
        supabase
          .from("enrolments")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds),
        supabase
          .from("course_purchases")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds)
          .eq("status", "paid")
          .gte("created_at", monthStart.toISOString()),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <WorkspaceShell kind="edu">
        <PageHead
          title="Your teaching"
          sub="Teach the thing you actually did. Short beats thorough."
        />

        {done ? (
          <div className="flag ok">
            <Ic name="check" />
            <span>Saved.</span>
          </div>
        ) : null}

        {!isEducator ? (
          <div className="flag hold" style={{ marginBottom: 16 }}>
            <Ic name="info" />
            <span>
              Courses are written by Educators. Ask the Global team about the
              role, and until then saving will be refused.
            </span>
          </div>
        ) : null}

        <div className="g3 g4">
          <Stat
            label="Courses"
            value={(courses ?? []).length}
            note="Written by you"
          />
          <Stat
            label="Published"
            value={
              (courses ?? []).filter(
                (c) => c.status === "published" && c.review === "approved"
              ).length
            }
            note="Live in Learning"
          />
          <Stat
            label="Learners"
            value={learners ?? 0}
            note="All time"
            href="/educator/learners"
          />
          <Stat
            label="Sales"
            value={sales ?? 0}
            note="This month"
            href="/educator/sales"
          />
        </div>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {(courses ?? []).length === 0 ? (
                <div className="panel panel-wash">
                  <p className="muted" style={{ margin: 0 }}>
                    Nothing yet.
                  </p>
                </div>
              ) : (
                (courses ?? []).map((course) => (
                  <div className="panel" key={course.id}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <h3>{course.title}</h3>
                      <span
                        className={`chip ${
                          course.status === "published" && course.review === "approved"
                            ? "chip-mint"
                            : ""
                        }`}
                      >
                        {course.status === "published" && course.review !== "approved"
                          ? "waiting to be read"
                          : course.status}
                      </span>
                    </div>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {course.summary}
                    </p>
                    {course.status === "published" && course.review !== "approved" ? (
                      <p className="muted small">
                        {course.review === "refused"
                          ? "This one was refused."
                          : "Somebody reads every course before it goes out to members."}
                        {course.review_note ? ` ${course.review_note}` : ""}
                      </p>
                    ) : null}
                    <div className="row">
                      <Link className="btn btn-ghost" href={`/educator/${course.slug}`}>
                        Lessons
                      </Link>
                      <Link className="btn btn-ghost" href={`/learning/${course.slug}`}>
                        See it as a member
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            <CourseForm />
          </div>
        </section>
      </WorkspaceShell>
  );
}