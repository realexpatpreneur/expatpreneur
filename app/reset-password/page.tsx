import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { ResetForm } from "./form";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Reset your password, ExpatPreneurs Global" };

export default function ResetPasswordPage() {
  return (
    <PublicPage>
      <main className="wrap">
        <section className="sec">
          <Crumbs trail={[["Sign in", "/login"], ["Reset your password"]]} />
          <h1>Reset your password</h1>
          <p className="lead">
            Only if you set one. Most members sign in with a link instead,
            which needs no password at all.
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            <ResetForm />
            <div className="panel panel-wash">
              <h3>Or skip it</h3>
              <p className="muted small" style={{ marginTop: 8 }}>
                A sign in link does the same job without a password to
                forget.
              </p>
              <Link className="btn btn-ghost" href="/login">
                Send me a sign in link
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}