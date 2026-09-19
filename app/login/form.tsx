"use client";

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
        <div className="notice good">
          Check your email. The link signs you in and lasts one hour.
        </div>
        <p className="muted small">
          Nothing arrived? Look in spam, then try again.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel" style={{ maxWidth: 520 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
        <span className="hint">
          Use the address your invitation was sent to.
        </span>
      </label>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Email me a link"}
      </button>
    </form>
  );
}
