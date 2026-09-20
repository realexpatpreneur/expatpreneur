import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { OpenRoundForm, RenewalNote } from "./forms";

export const metadata = { title: "Member care, Admin" };

export default async function MemberCarePage({
  searchParams,
}: {
  searchParams: Promise<{ asked?: string }>;
}) {
  const { asked } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageId = admin.homeVillageId ?? admin.villageIds[0] ?? null;

  const [{ data: members }, { data: activity }, { data: renewals }] =
    await Promise.all([
      villageId
        ? supabase
            .from("profiles")
            .select("id, full_name, status, joined_on, circle_id")
            .eq("village_id", villageId)
            .in("status", ["active", "quiet", "onboarding"])
            .order("full_name")
        : Promise.resolve({ data: [] }),
      villageId
        ? supabase
            .from("member_activity")
            .select("profile_id, posts, replies, events, attended, last_seen")
            .eq("village_id", villageId)
        : Promise.resolve({ data: [] }),
      supabase
        .from("re_enrolments")
        .select("id, profile_id, cycle, status, note, admin_note, asked_at")
        .order("asked_at", { ascending: false })
        .limit(200),
    ]);

  const activityOf = (id: string) =>
    activity?.find((a) => a.profile_id === id) ?? {
      posts: 0,
      replies: 0,
      events: 0,
      attended: 0,
      last_seen: null as string | null,
    };

  // Quiet means nothing posted, nothing answered and nothing attended.
  const quiet = (members ?? []).filter((m) => {
    const a = activityOf(m.id);
    return a.posts + a.replies + a.attended === 0;
  });

  const nameOf = (id: string) =>
    members?.find((m) => m.id === id)?.full_name ?? "A member";

  const currentCycle = String(new Date().getFullYear() + 1);
  const round = (renewals ?? []).filter((r) => r.cycle === currentCycle);
  const counts = {
    asked: round.length,
    staying: round.filter((r) => r.status === "staying").length,
    leaving: round.filter((r) => r.status === "leaving").length,
    waiting: round.filter((r) => r.status === "pending").length,
  };

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Member care</h1>
        <p className="lead">
          Who is finding their feet, who has gone quiet, and who is due to be
          asked about another year.
        </p>
        {asked ? (
          <div className="flag ok">
            {asked} {Number(asked) === 1 ? "member has" : "members have"} been
            asked.
          </div>
        ) : null}
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>In the Village</h3>
            <p className="lead" style={{ margin: 0 }}>{(members ?? []).length}</p>
          </div>
          <div className="panel">
            <h3>Gone quiet</h3>
            <p className="lead" style={{ margin: 0 }}>{quiet.length}</p>
          </div>
          <div className="panel">
            <h3>Waiting on an answer</h3>
            <p className="lead" style={{ margin: 0 }}>{counts.waiting}</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>Gone quiet</h2>
        <p className="muted small">
          Nothing posted, nothing answered, nothing attended. A message from a
          person beats any reminder the platform can send.
        </p>
        {quiet.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nobody is sitting silent. That is rarer than it sounds.
            </p>
          </div>
        ) : (
          <div className="divide">
            {quiet.map((member) => {
              const a = activityOf(member.id);
              return (
                <div className="li linkrow" key={member.id}>
                  <div>
                    <b>{member.full_name}</b>
                    <div className="muted small">
                      Joined {member.joined_on ?? "not recorded"}.{" "}
                      {a.last_seen ? `Last seen ${timeAgo(a.last_seen)}.` : ""}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <Link className="btn btn-ghost" href={`/messages/${member.id}`}>
                      Message
                    </Link>
                    <Link className="btn btn-ghost" href={`/admin/members/${member.id}`}>
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="sec">
        <h2>Re-enrolment, {currentCycle}</h2>
        <div className="gside">
          <div>
            {round.length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  No round open for {currentCycle} yet.
                </p>
              </div>
            ) : (
              <>
                <p>
                  <span className="chip">{counts.asked} asked</span>{" "}
                  <span className="chip chip-mint">{counts.staying} staying</span>{" "}
                  <span className="chip chip-sun">{counts.leaving} leaving</span>{" "}
                  <span className="chip chip-blue">{counts.waiting} waiting</span>
                </p>
                <div className="stack">
                  {round.map((renewal) => (
                    <div className="panel" key={renewal.id}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <h3>{nameOf(renewal.profile_id)}</h3>
                        <span
                          className={`chip ${
                            renewal.status === "staying"
                              ? "chip-mint"
                              : renewal.status === "leaving"
                                ? "chip-sun"
                                : ""
                          }`}
                        >
                          {renewal.status}
                        </span>
                      </div>
                      {renewal.note ? (
                        <p className="muted small" style={{ marginTop: 6 }}>
                          They said: {renewal.note}
                        </p>
                      ) : null}
                      <RenewalNote
                        renewalId={renewal.id}
                        status={renewal.status}
                        note={renewal.admin_note}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="stack">
            <OpenRoundForm suggested={currentCycle} />
            <div className="panel panel-wash">
              <h3>Before you open a round</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Speak to the quiet ones first. Someone who has drifted will
                usually say leaving to a form and staying to a person, and the
                honest version is worth more either way.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}