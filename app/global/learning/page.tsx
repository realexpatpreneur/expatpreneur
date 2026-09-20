import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { ReviewButtons } from "./forms";

export const metadata = { title: "Learning, the Global team" };

export default async function GlobalLearningPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: courses }, { data: educatorRoles }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration, tier, status, review, review_note, educator_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("member_roles")
      .select("profile_id, created_at, ended_at")
      .eq("role", "educator")
      .is("ended_at", null),
  ]);

  const ids = [
    ...new Set([
      ...(courses ?? []).map((c) => c.educator_id).filter(Boolean),
      ...(educatorRoles ?? []).map((r) => r.profile_id),
    ]),
  ] as string[];

  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name, village_id").in("id", ids)
    : { data: [] };

  const nameOf = (id: string | null) =>
    people?.find((p) => p.id === id)?.full_name ?? "Somebody";

  const waiting = (courses ?? []).filter(
    (c) => c.status === "published" && c.review !== "approved"
  );
  const live = (courses ?? []).filter(
    (c) => c.status === "published" && c.review === "approved"
  );
  const drafts = (courses ?? []).filter((c) => c.status !== "published");

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Learning</h1>
          <p className="lead">
            Who teaches here, and what they teach. A course reaches members
            only once somebody has read it.
          </p>
        </section>

        <section className="band">
          <h2>Waiting to be read</h2>
          {waiting.length === 0 ? (
            <p className="muted small">Nothing waiting.</p>
          ) : (
            <div className="stack" style={{ marginTop: 16 }}>
              {waiting.map((course) => (
                <div className="panel" key={course.id}>
                  <h3>{course.title}</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {nameOf(course.educator_id)}. {course.duration ?? course.level}.{" "}
                    {course.tier === "paid" ? "Paid members only" : "Every member"}.{" "}
                    {timeAgo(course.updated_at)}.{" "}
                    <span className="chip">{course.review}</span>
                  </p>
                  <p style={{ marginTop: 8 }}>{course.summary}</p>
                  <p>
                    <Link className="btn" href={`/learning/${course.slug}`}>
                      Read it
                    </Link>
                  </p>
                  <ReviewButtons id={course.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="band">
          <div className="cols">
            <div className="panel">
              <h3>Open to members</h3>
              {live.length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Nothing is open yet.
                </p>
              ) : (
                <div className="rows" style={{ marginTop: 12 }}>
                  {live.map((course) => (
                    <Link
                      className="rowlink"
                      href={`/learning/${course.slug}`}
                      key={course.id}
                    >
                      <div>
                        <b>{course.title}</b>
                        <div className="muted small">
                          {nameOf(course.educator_id)}
                        </div>
                      </div>
                      <div className="rowmeta">
                        <span className="chip mint">approved</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="panel">
                <h3>Educators</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  The Educator role is given at Roles, and taken back the same
                  way.
                </p>
                <div className="rows" style={{ marginTop: 12 }}>
                  {(educatorRoles ?? []).map((role) => (
                    <div className="rowlink" key={role.profile_id}>
                      <div>
                        <b>{nameOf(role.profile_id)}</b>
                        <div className="muted small">
                          {
                            (courses ?? []).filter(
                              (c) => c.educator_id === role.profile_id
                            ).length
                          }{" "}
                          courses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link className="btn" href="/global/roles">
                  Roles
                </Link>
              </div>

              <div className="panel wash">
                <h3>Drafts</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {drafts.length} being written. Nobody sees them but their
                  educator.
                </p>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}