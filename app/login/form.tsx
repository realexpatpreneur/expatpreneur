"use client";

import Link from "next/link";

import { useActionState } from "react";
import { sendSignInLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendSignInLink,
    {}
  );

  if (state.sent) {
    return (
      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="flag ok">
          Check your email. The link signs you in and lasts one hour.
        </div>
        <p className="muted small">
          Nothing arrived? Look in spam, then try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <form action={action} className="panel" style={{ maxWidth: 520 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
        <span className="hint">
          Use the address your invitation was sent to.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Email me a link"}
      </button>
      </form>

      <p className="muted small" style={{ marginTop: 12 }}>
        Set a password in your settings? <Link href="/reset-password">Reset it here</Link>.
      </p>
    </>
  );
}