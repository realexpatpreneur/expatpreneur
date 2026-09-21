import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { PublicPage } from "@/components/public-page";
import { LegalTabs } from "@/components/legal-tabs";

export const metadata = { title: "Cookie policy, ExpatPreneurs Global" };

// Draft only. What it describes is what the platform actually sets
// today, which is the right starting point for the lawyer.
export default async function CookiesPage() {
  const page = await livePage("cookies");

  if (page) {
    return (
      <PublicPage>
        <main className="wrap">
          <Blocks blocks={page.blocks} />
        </main>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <main className="wrap">
        <section className="sec">
          <LegalTabs here="/legal/cookies" />
          <h1 style={{ marginTop: 18 }}>Cookie policy</h1>
          <p className="lead">
            What we keep on your device, and why.
          </p>
          <div className="flag hold">
            Draft. It matches what the platform sets today. It is reviewed
            before launch.
          </div>
        </section>

        <section className="sec">
          <div className="panel" style={{ maxWidth: 760 }}>
            <h3>Essential cookies</h3>
            <p className="muted small">
              One set by Supabase, which keeps you signed in and keeps the
              session secure. Without it you would have to sign in on every
              page. It cannot be switched off while you are using an account.
            </p>

            <h3>Analytics</h3>
            <p className="muted small">
              Vercel counts page views to tell us which pages are used and how
              quickly they load. It does not follow you to other sites and it
              does not build a profile of you.
            </p>

            <h3>Advertising</h3>
            <p className="muted small">
              None. We do not advertise to you and we do not let anyone else
              advertise to you here.
            </p>

            <h3>Your choice</h3>
            <p className="muted small">
              You can clear or block cookies in your browser. Blocking the
              essential one will sign you out and keep you out.
            </p>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}