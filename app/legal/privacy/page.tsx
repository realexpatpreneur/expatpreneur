import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Privacy policy, ExpatPreneurs Global" };

// Draft only. It describes what the platform actually does today, which is
// the right starting point for the lawyer rather than a generic template.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Privacy policy</h1>
          <p className="lead">
            What we hold, why we hold it, and who can see it.
          </p>
          <div className="notice bad">
            Draft. It matches what the platform does today. The entity, the
            contact address and the retention periods are still to be confirmed.
          </div>
        </section>

        <section className="band">
          <div className="panel" style={{ maxWidth: 760 }}>
            <h3>What we collect</h3>
            <p className="muted small">
              What you give us when you request an invitation: your name, email,
              phone, city, business, industry, nationalities, languages and your
              answers. Later, what you choose to put on your profile, what you
              post, who you message, and which events you register for.
            </p>

            <h3>Why</h3>
            <p className="muted small">
              To decide on your request, to place you in a Village and a Circle,
              to run the community, and to keep the balance of each Village. We
              do not sell anything to anyone, and we do not advertise to you.
            </p>

            <h3>Who sees what</h3>
            <p className="muted small">
              Members see your profile as you chose to show it. The public sees
              only what you marked as public, and never your email, your phone
              or what you wrote for us. Your Local Admin sees your member
              record. The Global team sees all Villages.
            </p>

            <h3>Nationalities</h3>
            <p className="muted small">
              We ask because a Village works better when it is mixed. It is used
              inside the admin workspaces only, never shown to members, and
              never a reason we give to anyone.
            </p>

            <h3>Anonymous suggestions</h3>
            <p className="muted small">
              When you send a suggestion anonymously, no identifier is stored
              with it. Nobody, including us, can trace it back to you.
            </p>

            <h3>Where it lives</h3>
            <p className="muted small">
              On Supabase and Vercel. Payments are handled by Stripe, who hold
              the card details; we never see them.
            </p>

            <h3>Your rights</h3>
            <p className="muted small">
              You can ask for a copy of what we hold, correct it, or ask us to
              delete it. Write to [contact address]. If you are in the European
              Union you can also complain to your data protection authority.
            </p>

            <h3>How long</h3>
            <p className="muted small">
              While you are a member, and for [period] afterwards. Declined
              requests are kept for [period] so we can recognise a repeat
              application.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}