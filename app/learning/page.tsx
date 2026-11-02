import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { Arrow, Faces, PHOTO } from "@/components/design/parts";

export const metadata = { title: "Learning, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

type CatalogueRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string | null;
  duration: string | null;
  tier: string;
  educator_id?: string | null;
  cover_url?: string | null;
  price_cents: number;
  member_price_cents: number | null;
  currency: string;
  public_listing: boolean;
  format?: string | null;
  starts_at?: string | null;
};

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
    // A visitor is granted only some course columns (0017, 0021), and
    // asking for any other fails the whole query, which left the public
    // catalogue empty. Members are granted the lot.
    (member
      ? supabase
          .from("courses")
          .select("id, slug, title, summary, level, duration, tier, educator_id, cover_url, price_cents, member_price_cents, currency, public_listing, format, starts_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
      : supabase
          .from("courses")
          .select("id, slug, title, summary, level, duration, tier, price_cents, member_price_cents, currency, public_listing")
          .eq("status", "published")
          .order("created_at", { ascending: false })) as unknown as Promise<{ data: CatalogueRow[] | null }>,
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

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    const lead = shown[0];
    const later = shown.slice(1);

    // The same two lines the card used to carry, in the designed type.
    const kindLine = (course: CatalogueRow) => (
      <>
        {course.format === "live" ? "Live workshop" : "Recorded"}
        {course.duration ? `, ${course.duration}` : ""}
      </>
    );

    // Nobody is signed in here, so a paid course is locked and the price
    // is the public one.
    const metaLine = (course: CatalogueRow) =>
      course.tier === "paid" ? (
        <span style={{ fontSize: 13, fontWeight: 700, border: "1px solid #C7CDD4", borderRadius: 4, padding: "6px 10px" }}>
          Village Membership
        </span>
      ) : (
        <>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{priceOf(course)}</span>
          <span className="d-small" style={{ fontSize: 13 }}>
            {educators?.find((e) => e.id === course.educator_id)?.full_name ?? "A member"}
          </span>
        </>
      );

    return (
      <PublicPage active="/learning">
        <PageBlocks data={{ courses: courses ?? [] }} slug="learning">
        <div className="d-page">
          <section style={{ padding: "64px 0 48px" }}>
            <div className="d-wrap">
              <h1 className="d-h1" style={{ maxWidth: "12ch" }}>Learning</h1>
              <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>
                Short courses from members who have already done the thing, not
                from people who read about it.
              </p>
            </div>
          </section>

          <div className="d-wrap">
            <nav className="d-tabs">
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
                  className={show === key ? "on" : ""}
                  href={`/learning?show=${key}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <section style={{ padding: "56px 0 96px" }}>
            <div className="d-wrap">
              {shown.length === 0 ? (
                <div className="d-rows">
                  <div className="d-row">
                    <p className="d-body">Nothing published yet.</p>
                  </div>
                </div>
              ) : (
                <>
                  <Link className="d-feature" href={`/learning/${lead.slug}`}>
                    <span className="d-fimg">
                      {lead.cover_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={lead.cover_url} alt="" />
                      ) : (
                        <span
                          className="d-cover-tile"
                          style={{ position: "absolute", inset: 0, background: "#0F1419", padding: 32, fontSize: 30 }}
                        >
                          {lead.title}
                        </span>
                      )}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", padding: 36 }}>
                      <span className="d-lbl d-blue">{kindLine(lead)}</span>
                      {lead.summary ? (
                        <b style={{ display: "block", marginTop: 16, fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.15 }}>
                          {lead.summary}
                        </b>
                      ) : null}
                      <span style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto", paddingTop: 28 }}>
                        {metaLine(lead)}
                      </span>
                    </span>
                  </Link>

                  {later.length ? (
                    <div style={{ marginTop: 56 }}>
                      {later.map((course) => (
                        <Link className="d-mrow" key={course.id} href={`/learning/${course.slug}`}>
                          <span className="d-thumb" style={{ height: 86 }}>
                            {course.cover_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={course.cover_url} alt="" />
                            ) : (
                              <span className="d-cover-tile" style={{ padding: 12, fontSize: 14 }}>
                                {course.title}
                              </span>
                            )}
                          </span>
                          <span>
                            <span className="d-lbl" style={{ color: "#6B7683" }}>{kindLine(course)}</span>
                            {course.summary ? (
                              <b style={{ display: "block", marginTop: 6, fontSize: 17, lineHeight: 1.35 }}>{course.summary}</b>
                            ) : null}
                            <span style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
                              {metaLine(course)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="d-sec d-washed">
            <div className="d-wrap d-head" style={{ marginBottom: 0, alignItems: "center" }}>
              <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                <h2 className="d-h2">Teach in the network</h2>
                <p className="d-lead" style={{ marginTop: 14, maxWidth: "54ch" }}>
                  Village Members can apply to become educators and earn from their
                  workshops. ExpatPreneurs handles the payment and pays you your
                  share.
                </p>
              </div>
              <Link className="d-btn d-btn-line d-shine" href="/membership">
                See membership
              </Link>
            </div>
          </section>

          <section className="d-sec">
            <div className="d-wrap">
              <div className="d-dark" style={{ borderRadius: 6, padding: 52, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                  <span style={{ display: "block", marginBottom: 22 }}>
                    <Faces srcs={[PHOTO.kristiane, PHOTO.julien, PHOTO.ines]} size={48} />
                  </span>
                  <h2 className="d-h2">Members pay less, and some courses are theirs alone</h2>
                  <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.6, color: "#B9C3CD" }}>
                    Anyone can buy these. Members get the member price, and the
                    courses written for the network.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <Link className="d-btn d-btn-mint d-shine" href="/apply">Request an invitation <Arrow /></Link>
                  <Link className="d-btn d-btn-ghost" href="/membership">What membership costs</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
        </PageBlocks>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/learning" active="/learning">
      <PageBlocks data={{ courses: courses ?? [] }} slug="learning">
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
                          <span className="chip chip-sun">Village Membership</span>
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
              Village Members can apply to become educators and earn from their
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
            </PageBlocks>
</DualPage>
  );
}