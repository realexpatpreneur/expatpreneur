"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

// When something goes wrong the navigation stays, so nobody is stranded.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pub">
      <section className="pubsec hero-center">
        <h1>Something went wrong here</h1>
        <p className="intro">
          The page did not load. Trying again usually works; if it keeps
          happening, tell the build team what you were doing.
        </p>
        <div className="ctas" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-ghost" href="/">
            Back to the start
          </Link>
        </div>
        {error.digest ? (
          <p className="muted small" style={{ marginTop: 16 }}>
            Reference {error.digest}
          </p>
        ) : null}
      </section>
      <SiteFooter />
    </div>
  );
}