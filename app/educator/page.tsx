import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
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

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Your courses</h1>
          <p className="lead">
            Teach the thing you actually did. Short beats thorough.
          </p>
          {done ? <div className="notice good">Saved.</div> : null}
          {!isEducator ? (
            <div className="notice bad">
              Courses are written by Educators. Ask the Global team about the
              role, and until then saving will be refused.
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              {(courses ?? []).length === 0 ? (
                <div className="panel wash">
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
                        className={`chip ${course.status === "published" ? "mint" : ""}`}
                      >
                        {course.status}
                      </span>
                    </div>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {course.summary}
                    </p>
                    <div className="row">
                      <Link className="btn" href={`/educator/${course.slug}`}>
                        Lessons
                      </Link>
                      <Link className="btn" href={`/learning/${course.slug}`}>
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
      </main>
    </>
  );
}