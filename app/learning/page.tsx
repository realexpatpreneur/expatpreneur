import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Learning, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

export default async function LearningPage() {
  const member = await requireMember("/learning");
  const supabase = await createClient();

  const [{ data: courses }, { data: mine }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration, tier, educator_id, cover_url")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("course_progress")
      .select("course_id, lessons, done")
      .eq("profile_id", member.id),
  ]);

  const educatorIds = [
    ...new Set((courses ?? []).map((c) => c.educator_id).filter(Boolean)),
  ] as string[];
  const { data: educators } = educatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", educatorIds)
    : { data: [] };

  const progressOf = (id: string) => mine?.find((m) => m.course_id === id);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Learning</h1>
          <p className="lead">
            Short courses from members who have already done the thing, not
            from people who read about it.
          </p>
        </section>

        <section className="band">
          {(courses ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(courses ?? []).map((course, i) => {
                const progress = progressOf(course.id);
                const locked = course.tier === "paid" && !isPaid(member);
                return (
                  <article className="card" key={course.id}>
                    <Link href={`/learning/${course.slug}`}>
                      {course.cover_url ? (
                        <div className="cover photo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.cover_url} alt="" />
                        </div>
                      ) : (
                        <div className={`cover ${covers[i % covers.length]}`}>
                          {course.title}
                        </div>
                      )}
                      <div className="kind">
                        {course.level}
                        {course.duration ? `, ${course.duration}` : ""}
                      </div>
                      <p>{course.summary}</p>
                      <div className="meta">
                        {progress ? (
                          <span className="chip mint">
                            {progress.done} of {progress.lessons} done
                          </span>
                        ) : locked ? (
                          <span className="chip sun">Paid plan</span>
                        ) : (
                          <span className="chip">
                            {educators?.find((e) => e.id === course.educator_id)
                              ?.full_name ?? "A member"}
                          </span>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}