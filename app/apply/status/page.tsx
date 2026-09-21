import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { StatusForm } from "./form";

export const metadata = {
  title: "Where your request stands, ExpatPreneurs Global",
};

export default function ApplicationStatusPage() {
  return (
    <>
      <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/apply">Request an invitation</Link>
          </p>
          <h1>Where your request stands</h1>
          <p className="lead">
            Somebody reads every one, so it takes days rather than minutes.
            You can check here in the meantime.
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            <StatusForm />
            <div className="stack">
              <div className="panel panel-wash">
                <h3>Why it takes a while</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Requests go to the Local Admins of the city you named, and
                  they are members with businesses of their own. A week is
                  normal.
                </p>
              </div>
              <div className="panel panel-wash">
                <h3>Lost the reference?</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Write to us and say which address you used. We will not
                  confirm anything about a request to anybody but the person
                  who made it.
                </p>
                <Link className="btn btn-ghost" href="/contact">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}