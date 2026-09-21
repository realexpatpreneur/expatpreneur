import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default async function ApplicationSentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <main className="wrap">
        <section className="sec">
          <h1>Thank you</h1>
          <p className="lead">
            Your request is with us. Someone reads every one, and you will hear
            back by email. If your city does not have a Village yet, we will
            tell you when it opens.
          </p>
          {ref ? (
            <div className="panel" style={{ maxWidth: 520, marginTop: 18 }}>
              <h3>Your reference is {ref}</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Write it down. With the email address you used, it shows you
                where your request stands at any point. It is in the email we
                just sent you as well.
              </p>
              <Link className="btn btn-ghost" href="/apply/status">
                Check where it stands
              </Link>
            </div>
          ) : null}

          <p style={{ marginTop: 18 }}>
            <Link className="btn btn-ghost" href="/">
              Back to the site
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}