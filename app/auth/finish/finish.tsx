"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The last few feet of an emailed link.
//
// An invitation is minted on the server through the admin API, so the
// person's browser never stored a PKCE verifier and GoTrue cannot answer
// with a code. It answers with the tokens in the URL fragment instead,
// and a fragment is never sent to a server, which is why /auth/callback
// cannot see it. This runs in the browser, where it can.
//
// Signing in here writes the same cookies the rest of the site reads,
// so the step after this is an ordinary page load.
type Outcome = "working" | "expired" | "nothing";

export function FinishSignIn({ next }: { next: string }) {
  const [outcome, setOutcome] = useState<Outcome>("working");

  useEffect(() => {
    let stopped = false;

    async function run() {
      const supabase = createClient();
      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      // GoTrue says why it refused in the fragment too: a link that was
      // used already, or one older than its hour.
      if (hash.get("error") || hash.get("error_code")) {
        if (!stopped) setOutcome("expired");
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      // The tokens are read before any existing session is considered,
      // because somebody may be signed in as themselves while opening an
      // invitation that belongs to somebody else. The link wins.
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          if (!stopped) setOutcome("expired");
          return;
        }
        // A full load rather than a client route change, so the server
        // reads the cookies that were just written.
        window.location.replace(next);
        return;
      }

      // No tokens in the fragment. The client may have swallowed them on
      // its own while starting up, which leaves a session and an empty
      // fragment, so that is worth asking about before giving up.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace(next);
        return;
      }

      if (!stopped) setOutcome("nothing");
    }

    void run();
    return () => {
      stopped = true;
    };
  }, [next]);

  if (outcome === "working") {
    return (
      <div className="panel">
        <h3>Signing you in</h3>
        <p className="muted small" style={{ marginTop: 8 }}>
          One moment.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="flag hold">
        {outcome === "expired"
          ? "That link has been used already, or it is more than an hour old."
          : "This page was opened without a sign in link."}
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Links last an hour and work once. Ask for a fresh one and it will
        come to the same address your invitation went to.
      </p>
      <p className="muted small" style={{ marginTop: 12 }}>
        <Link href={`/login?next=${encodeURIComponent(next)}`}>
          Send me a new link
        </Link>
      </p>
    </div>
  );
}
