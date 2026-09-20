import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";

export const metadata = { title: "Terms of service, ExpatPreneurs Global" };

// Draft only. The company details, the governing law and the fee terms are
// placeholders, and a lawyer signs this off before launch.
export default async function TermsPage() {
  // A published page replaces what is written below.
  const page = await livePage("terms");

  if (page) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <Blocks blocks={page.blocks} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="sec">
          <h1>Terms of service</h1>
          <p className="lead">
            The agreement between ExpatPreneurs Global and its members.
          </p>
          <div className="flag hold">
            Draft. Company details, governing law and fees are still to be
            confirmed, and this is reviewed before launch.
          </div>
        </section>

        <section className="sec">
          <div className="panel" style={{ maxWidth: 760 }}>
            <h3>1. Who we are</h3>
            <p className="muted small">
              ExpatPreneurs Global, [registered entity, registration number,
              registered address].
            </p>

            <h3>2. Membership</h3>
            <p className="muted small">
              Membership is by invitation and is personal to you. It cannot be
              transferred, shared or sold. We may decline a request without
              giving a reason, and we may end a membership where these terms or
              the community rules are broken.
            </p>

            <h3>3. The community rules</h3>
            <p className="muted small">
              Members help before they sell. Members do not pitch in the groups
              or in messages that were not invited. What is shared inside a
              Circle stays inside it. Breaking these is the usual reason a
              membership ends.
            </p>

            <h3>4. What you put here</h3>
            <p className="muted small">
              You keep what you write. You give us permission to show it to the
              members it was meant for, and to keep it while your membership
              lasts. You are responsible for what you post, and for having the
              right to post it.
            </p>

            <h3>5. Fees</h3>
            <p className="muted small">
              Membership is free. The paid plan is charged [amount and period],
              renews automatically, and can be cancelled at any time, running
              until the end of the period already paid for. Event tickets are
              refundable as stated on the event.
            </p>

            <h3>6. What we do not promise</h3>
            <p className="muted small">
              We introduce people. We do not guarantee business, referrals,
              revenue, or the conduct of any member. Advice from a member is
              theirs, not ours, and does not replace professional advice.
            </p>

            <h3>7. Ending it</h3>
            <p className="muted small">
              You can leave at any time. We may suspend or end a membership for
              conduct that harms other members, and we will say why unless
              saying so would put someone at risk.
            </p>

            <h3>8. Law</h3>
            <p className="muted small">
              These terms are governed by the law of [jurisdiction], and the
              courts of [jurisdiction] have exclusive jurisdiction.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}