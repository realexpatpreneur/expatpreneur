import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export const metadata = { title: "Check your inbox, ExpatPreneurs Global" };

export default function SubscribedPage() {
  return (
    <PublicPage>
      <main className="wrap">
        <section className="sec">
          <h1>Check your inbox</h1>
          <p className="lead">
            Confirm your email address to start receiving the newsletter.
          </p>
          <p>
            <Link className="btn btn-primary" href="/media">
              Back to Media
            </Link>
          </p>
        </section>
      </main>
    </PublicPage>
  );
}