import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Check your inbox, ExpatPreneurs Global" };

export default function ResetSentPage() {
  return (
    <>
      <main className="wrap">
        <section className="sec">
          <h1>Check your inbox</h1>
          <p className="lead">
            If that address belongs to a member, a link is on its way. It
            opens your settings, where you set a new password.
          </p>
          <p>
            <Link className="btn btn-ghost" href="/login">
              Back to signing in
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}