import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, nationalityMix, NATIONALITY_LIMIT } from "@/lib/access";
import { ApproveForm, WaitlistForm, DeclineForm } from "./decision-forms";

const doneText: Record<string, string> = {
  approved:
    "Approved. The invitation email is on its way, and the profile is ready.",
  waitlisted: "Moved to the waitlist.",
  declined: "Decision recorded.",
};

export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;

  await requireAdmin();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!application) notFound();

  const villageId = application.village_id as string | null;

  const [{ data: village }, { data: members }, { data: circles }] =
    await Promise.all([
      villageId
        ? supabase.from("villages").select("name").eq("id", villageId).maybeSingle()
        : Promise.resolve({ data: null }),
      villageId
        ? supabase
            .from("profiles")
            .select("nationalities")
            .eq("village_id", villageId)
            .in("status", ["active", "onboarding"])
        : Promise.resolve({ data: [] }),
      villageId
        ? supabase
            .from("circle_capacity")
            .select("circle_id, name, places_left")
            .eq("village_id", villageId)
        : Promise.resolve({ data: [] }),
    ]);

  // Internal balance check. This never leaves the admin workspace.
  const mix = nationalityMix(members ?? []);
  const total = (members ?? []).length;
  const applicantNats: string[] = application.nationalities ?? [];
  const checks = applicantNats.map((nat) => {
    const now = mix.get(nat) ?? 0;
    const after = total + 1 === 0 ? 0 : (now + 1) / (total + 1);
    return { nat, now, share: after, over: after > NATIONALITY_LIMIT };
  });
  const overLimit = checks.filter((c) => c.over);
  const warning =
    overLimit.length > 0
      ? `Approving takes ${overLimit
          .map((c) => `${c.nat} to ${Math.round(c.share * 100)} percent`)
          .join(" and ")} of this Village. You can still approve.`
      : null;

  const answers = (application.answers ?? {}) as Record<string, string>;

  const openCircles = (circles ?? [])
    .filter((c) => (c.places_left ?? 0) > 0)
    .map((c) => ({
      id: c.circle_id as string,
      name: c.name as string,
      places_left: c.places_left as number,
    }));

  const decided = ["approved", "declined"].includes(application.status);

  return (
    <main className="wrap">
      <section className="band">
        <p className="muted small">
          <Link href="/admin/applications">Invitation requests</Link>
        </p>
        <h1>{application.full_name}</h1>
        <p className="lead">
          {application.city}
          {application.country ? `, ${application.country}` : ""}.{" "}
          {village?.name ? `${village.name} Village.` : "No Village chosen."}
        </p>
        <p>
          <span className="chip">{application.status.replace("_", " ")}</span>{" "}
          <span className="chip">{application.email}</span>
        </p>
        {done && doneText[done] ? (
          <div className="notice good">{doneText[done]}</div>
        ) : null}
      </section>

      <section className="band">
        <div className="cols">
          <div className="panel">
            <h3>What they told us</h3>
            <dl className="kv">
              <dt>Business</dt>
              <dd>{application.business_name || "Not given"}</dd>
              <dt>Industry</dt>
              <dd>{application.industry || "Not given"}</dd>
              <dt>Phone</dt>
              <dd>{application.phone || "Not given"}</dd>
              <dt>Nationalities</dt>
              <dd>{applicantNats.join(", ") || "Not given"}</dd>
              <dt>Languages</dt>
              <dd>{(application.languages ?? []).join(", ") || "Not given"}</dd>
              <dt>About the business</dt>
              <dd>{answers.about_business || "Not given"}</dd>
              <dt>Why they want to join</dt>
              <dd>{answers.why_join || "Not given"}</dd>
              <dt>What they could give</dt>
              <dd>{answers.contribute || "Not given"}</dd>
              <dt>How they heard about us</dt>
              <dd>{answers.heard_about || "Not given"}</dd>
            </dl>
          </div>

          <div className="stack">
            <div className="panel wash">
              <h3>Village balance</h3>
              <p className="muted small">
                Internal only. No Village goes above 30 percent of one
                nationality. This is never mentioned to applicants or members.
              </p>
              {total === 0 ? (
                <p className="muted small">
                  No members in this Village yet, so nothing to balance.
                </p>
              ) : (
                <ul className="plain">
                  {checks.map((c) => (
                    <li key={c.nat}>
                      {c.nat}: {c.now} of {total} now, {Math.round(c.share * 100)}{" "}
                      percent after approval
                      {c.over ? " (over the limit)" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {decided ? (
              <div className="panel">
                <h3>Decided</h3>
                <p className="muted small">
                  This request was {application.status}. Nothing further to do
                  here.
                </p>
              </div>
            ) : (
              <>
                <ApproveForm id={id} circles={openCircles} warning={warning} />
                <WaitlistForm id={id} />
                <DeclineForm id={id} />
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}