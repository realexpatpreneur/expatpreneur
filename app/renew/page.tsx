import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { RenewalForm } from "./form";

export const metadata = { title: "Another year, ExpatPreneurs Global" };

export default async function RenewPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const member = await requireMember("/renew");
  const supabase = await createClient();

  const { data: renewal } = await supabase
    .from("re_enrolments")
    .select("id, cycle, status")
    .eq("profile_id", member.id)
    .order("asked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <WorkspaceShell kind="member" nav="/renew">
        <section className="sec">
          <h1>Another year?</h1>
          <p className="lead">
            Membership is renewed by a decision, not by silence. Once a year we
            ask, and either answer is a good one.
          </p>
        </section>

        <section className="sec">
          {done === "staying" ? (
            <div className="panel" style={{ maxWidth: 680 }}>
              <h3>Good. See you at the next one.</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Nothing changes. Your Circle and your Village carry on.
              </p>
              <Link className="btn btn-ghost" href="/home">
                Back to home
              </Link>
            </div>
          ) : done === "leaving" ? (
            <div className="panel" style={{ maxWidth: 680 }}>
              <h3>Thank you for the time you gave it</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Your Local Admin will be in touch about the last details. You
                are welcome to come back.
              </p>
              <Link className="btn btn-ghost" href="/home">
                Back to home
              </Link>
            </div>
          ) : !renewal ? (
            <div className="panel panel-wash" style={{ maxWidth: 680 }}>
              <h3>Nothing to answer</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                You are not in a re-enrolment round at the moment. This page
                wakes up once a year.
              </p>
              <Link className="btn btn-ghost" href="/home">
                Back to home
              </Link>
            </div>
          ) : renewal.status !== "pending" ? (
            <div className="panel" style={{ maxWidth: 680 }}>
              <h3>You already answered</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                For {renewal.cycle} you said you are{" "}
                {renewal.status === "staying" ? "staying" : "stepping away"}. If
                that has changed, tell your Local Admin.
              </p>
              <Link className="btn btn-ghost" href="/home">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="gside">
              <RenewalForm renewalId={renewal.id} />
              <div className="stack">
                <div className="panel">
                  <h3>Why we ask</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    A Circle of fifty where fifteen have quietly drifted is not
                    a Circle of fifty. Asking every year keeps the rooms full of
                    people who want to be in them.
                  </p>
                </div>
                <div className="panel panel-wash">
                  <h3>What happens to your place</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    If you step away, it goes to someone on the waiting list in
                    your city, which is usually longer than the Circle.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}