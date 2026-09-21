import { DualPage } from "@/components/dual-page";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";

export const metadata = { title: "Learning, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

export default async function LearningPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  // Anybody can look at the catalogue. What it costs, and whether you can
  // start it, depends on who is reading.
  const member = await whoIsHere();
  const supabase = await createClient();

  const [{ data: courses }, { data: mine }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration, tier, educator_id, cover_url, price_cents, member_price_cents, currency, public_listing, format, starts_at")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    member
      ? supabase
          .from("course_progress")
          .select("course_id, lessons, done")
          .eq("profile_id", member.id)
      : Promise.resolve({ data: [] }),
  ]);

  const educatorIds = [
    ...new Set((courses ?? []).map((c) => c.educator_id).filter(Boolean)),
  ] as string[];
  const { data: educators } = educatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", educatorIds)
    : { data: [] };

  const progressOf = (id: string) => mine?.find((m) => m.course_id === id);

  const money = (cents: number, currency: string) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

  const priceOf = (course: {
    price_cents: number;
    member_price_cents: number | null;
    currency: string;
  }) => {
    const cents = member
      ? course.member_price_cents ?? course.price_cents
      : course.price_cents;
    return cents === 0 ? "Free" : money(cents, course.currency);
  };

  // Somebody who is not signed in sees only what is offered publicly.
  const visible = (courses ?? []).filter((c) => member || c.public_listing);

  const shown = visible.filter((c) => {
    if (show === "live") return c.format === "live";
    if (show === "recorded") return c.format !== "live";
    if (show === "free") {
      const cents = member ? c.member_price_cents ?? c.price_cents : c.price_cents;
      return cents === 0;
    }
    return true;
  });

  return (
    <DualPage member={Boolean(member)} nav="/learning" active="/learning">
        <section className={member ? "sec" : "pubsec hero-center"}>
          <h1>Learning</h1>
          <p className="lead">
            Short courses from members who have already done the thing, not
            from people who read about it.
          </p>

          <div className="filters">
            {(
              [
                ["all", "All"],
                ["live", "Live"],
                ["recorded", "Recorded"],
                ["free", "Free"],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/learning?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {shown.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="g3">
              {shown.map((course, i) => {
                const progress = progressOf(course.id);
                const locked =
                  course.tier === "paid" && (!member || !isPaid(member));
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
                        {course.format === "live" ? "Live workshop" : "Recorded"}
                        {course.duration ? `, ${course.duration}` : ""}
                      </div>
                      <p>{course.summary}</p>
                      <div className="meta">
                        {progress ? (
                          <span className="chip chip-mint">
                            {progress.done} of {progress.lessons} done
                          </span>
                        ) : locked ? (
                          <span className="chip chip-sun">Paid plan</span>
                        ) : (
                          <>
                            <span className="chip">{priceOf(course)}</span>{" "}
                            <span className="chip">
                              {educators?.find((e) => e.id === course.educator_id)
                                ?.full_name ?? "A member"}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="sec">
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 15 }}>Teach in the network</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Paid members can apply to become educators and earn from their
              workshops. ExpatPreneurs handles the payment and pays you your
              share.
            </p>
            <Link
              className="btn btn-ghost btn-sm"
              href={member ? "/educator" : "/membership"}
            >
              {member ? "Your teaching" : "See membership"}
            </Link>
          </div>
        </section>

        {member ? null : (
          <section className="sec">
            <h2>Members pay less, and some courses are theirs alone</h2>
            <p className="lead">
              Anyone can buy these. Members get the member price, and the
              courses written for the network.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>{" "}
              <Link className="btn btn-ghost" href="/membership">
                What membership costs
              </Link>
            </p>
          </section>
        )}
      </DualPage>
  );
}