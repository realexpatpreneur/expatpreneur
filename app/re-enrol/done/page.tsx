import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { Ic } from "@/components/icon";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default function ReEnrolDeclinedPage() {
  return (
    <PublicPage>
      <section className="pubsec">
        <div className="done">
          <span className="doneic">
            <Ic name="check" />
          </span>
          <h1>Thank you for being part of it</h1>
          <p>
            We will take you out of the WhatsApp group. If you ever want to come
            back, you can request an invitation and your Local Admin will see
            it.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            <Link className="btn btn-primary" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}