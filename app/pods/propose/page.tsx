import { WorkspaceShell } from "@/components/workspace-shell";
import { requireMember, isPaid } from "@/lib/member";
import { Lock } from "@/components/lock";
import { ProposePodForm } from "./form";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Propose a Pod, ExpatPreneurs Global" };

export default async function ProposePodPage() {
  const member = await requireMember("/pods/propose");
  const paid = isPaid(member);

  return (
    <WorkspaceShell kind="member" nav="/pods/propose">
        <section className="sec">
          <Crumbs trail={[["Pods", "/pods"], ["Propose a Pod"]]} />
          <h1>Propose a Pod</h1>
          <p className="lead">
            A few members working towards the same thing, for a fixed stretch,
            with somebody keeping it honest. That somebody is you.
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            {paid ? (
              <ProposePodForm />
            ) : (
              <div className="panel">
                <Lock note="">
                  Proposing a Growth Pod is part of Village Membership.
                </Lock>
              </div>
            )}
            <div className="stack">
              <div className="panel panel-wash">
                <h3>What makes a Pod work</h3>
                <p className="muted small" style={{ marginTop: 8 }}>
                  Six to eight people, one thing they are all trying to do,
                  and an end date. The ones that drift are the ones with a
                  broad purpose and no finish.
                </p>
              </div>
              <div className="panel panel-wash">
                <h3>What you are taking on</h3>
                <p className="muted small" style={{ marginTop: 8 }}>
                  Proposing means leading it: setting the meetings, opening
                  the room, and telling the Village when it is done.
                </p>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}