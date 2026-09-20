import Link from "next/link";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ProposePodForm } from "./form";

export const metadata = { title: "Propose a Pod, ExpatPreneurs Global" };

export default async function ProposePodPage() {
  await requireMember("/pods/propose");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/pods">Pods</Link>
          </p>
          <h1>Propose a Pod</h1>
          <p className="lead">
            A few members working towards the same thing, for a fixed stretch,
            with somebody keeping it honest. That somebody is you.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <ProposePodForm />
            <div className="stack">
              <div className="panel wash">
                <h3>What makes a Pod work</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Six to eight people, one thing they are all trying to do,
                  and an end date. The ones that drift are the ones with a
                  broad purpose and no finish.
                </p>
              </div>
              <div className="panel wash">
                <h3>What you are taking on</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Proposing means leading it: setting the meetings, opening
                  the room, and telling the Village when it is done.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}