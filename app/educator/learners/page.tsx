import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Learners, your courses" };

// Who has bought each course. Contact happens through platform messages,
// so no buyer's email address is shown here.
export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course = "" } = await searchParams;
  const member = await requireMember("/educator/learners");
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("educator_id", member.id)
    .order("title");

  const chosen = course
    ? (courses ?? []).find((c) => c.slug === course)
    : (courses ?? [])[0];

  const [{ data: purchases }, { data: progress }] = chosen
    ? await Promise.all([
        supabase
          .from("course_sales")
          .select("purchase_id, buyer_id, guest_name, amount_cents, currency, status, created_at")
          .eq("course_id", chosen.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("course_progress")
          .select("profile_id, lessons, done")
          .eq("course_id", chosen.id),
      ])
    : [{ data: [] }, { data: [] }];

  const ids = [
    ...new Set((purchases ?? []).map((p) => p.buyer_id).filter(Boolean)),
  ] as string[];

  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", ids)
    : { data: [] };

  const progressOf = (id: string | null) =>
    id ? progress?.find((p) => p.profile_id === id) : undefined;

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/educator">Your courses</Link>
          </p>
          <h1>Learners</h1>
          <p className="lead">
            {chosen ? chosen.title : "Who has bought your courses."}
          </p>

          {(courses ?? []).length > 1 ? (
            <div className="tabs">
              {(courses ?? []).map((c) => (
                <Link
                  className={`chip ${chosen?.id === c.id ? "mint" : ""}`}
                  href={`/educator/learners?course=${c.slug}`}
                  key={c.id}
                >
                  {c.title}
                </Link>
              ))}
            </div>
          ) : null}

          <p style={{ marginTop: 12 }}>
            <Link className="btn" href="/educator/sales">
              Write to everybody who bought it
            </Link>
          </p>
        </section>

        <section className="band">
          {!chosen ? (
            <p className="muted">You have not written a course yet.</p>
          ) : (purchases ?? []).length === 0 ? (
            <p className="muted">Nobody has bought this one yet.</p>
          ) : (
            <div className="rows">
              {(purchases ?? []).map((purchase) => {
                const person = people?.find((p) => p.id === purchase.buyer_id);
                const done = progressOf(purchase.buyer_id);
                return (
                  <div className="rowlink" key={purchase.purchase_id}>
                    <div>
                      <b>
                        {person ? (
                          <Link href={`/members/${person.id}`}>
                            {person.full_name}
                          </Link>
                        ) : (
                          purchase.guest_name ?? "Somebody from outside"
                        )}
                      </b>
                      <div className="muted small">
                        {person ? "Member" : "Bought from the public page"}.
                        Bought{" "}
                        {new Date(purchase.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                        })}
                        {done ? `. ${done.done} of ${done.lessons} lessons done` : ""}
                      </div>
                    </div>
                    <div className="rowmeta">
                      <span
                        className={`chip ${purchase.status === "paid" ? "mint" : ""}`}
                      >
                        {purchase.status === "refunded" ? "Refunded" : "Paid"}
                      </span>
                      {person ? (
                        <Link className="btn" href={`/messages/${person.id}`}>
                          Message
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="panel wash" style={{ marginTop: 20 }}>
            <h3>How to reach them</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Members are messaged inside the platform. People who bought
              from the public page have no account, so the only way to reach
              them is writing to everybody who bought the course, which goes
              to their email.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}