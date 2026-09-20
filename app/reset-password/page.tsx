import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResetForm } from "./form";

export const metadata = { title: "Reset your password, ExpatPreneurs Global" };

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/login">Sign in</Link>
          </p>
          <h1>Reset your password</h1>
          <p className="lead">
            Only if you set one. Most members sign in with a link instead,
            which needs no password at all.
          </p>
        </section>

        <section className="band">
          <div className="cols">
            <ResetForm />
            <div className="panel wash">
              <h3>Or skip it</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                A sign in link does the same job without a password to
                forget.
              </p>
              <Link className="btn" href="/login">
                Send me a sign in link
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}