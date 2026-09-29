"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendSignInLink, signInWithPassword, type LoginState } from "./actions";

// Two ways in. The link is the nicer one and needs email to be working;
// the password is the one that always works, which matters while email
// is not connected.
export function LoginForm({ next }: { next: string }) {
  const [how, setHow] = useState<"password" | "link">("password");

  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(
    sendSignInLink,
    {}
  );
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(
    signInWithPassword,
    {}
  );

  if (linkState.sent) {
    return (
      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="flag ok">
          Check your email. The link signs you in and lasts one hour.
        </div>
        <p className="muted small">Nothing arrived? Look in spam, then try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="pb-tabs" style={{ maxWidth: 520, marginBottom: 14 }}>
        <button
          type="button"
          className={how === "password" ? "on" : ""}
          onClick={() => setHow("password")}
        >
          With a password
        </button>
        <button
          type="button"
          className={how === "link" ? "on" : ""}
          onClick={() => setHow("link")}
        >
          Email me a link
        </button>
      </div>

      {how === "password" ? (
        <form action={pwAction} className="panel" style={{ maxWidth: 520 }}>
          {pwState.error ? <div className="flag hold">{pwState.error}</div> : null}
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={pwPending}>
            {pwPending ? "Signing in" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={linkAction} className="panel" style={{ maxWidth: 520 }}>
          {linkState.error ? <div className="flag hold">{linkState.error}</div> : null}
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
            <span className="hint">Use the address your invitation was sent to.</span>
          </label>
          <button className="btn btn-primary" type="submit" disabled={linkPending}>
            {linkPending ? "Sending" : "Email me a link"}
          </button>
          <p className="muted small" style={{ marginTop: 10 }}>
            A link needs email to be connected. Until then, use a password.
          </p>
        </form>
      )}

      <p className="muted small" style={{ marginTop: 12 }}>
        Forgotten your password? <Link href="/reset-password">Reset it here</Link>.
      </p>
    </>
  );
}