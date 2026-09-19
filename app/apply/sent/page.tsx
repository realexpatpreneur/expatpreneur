import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ApplicationSentPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <h1>Thank you</h1>
          <p className="lead">
            Your request is with us. Someone reads every one, and you will hear
            back by email. If your city does not have a Village yet, we will
            tell you when it opens.
          </p>
          <p>
            <Link className="btn" href="/">
              Back to the site
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
