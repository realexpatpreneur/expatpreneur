"use client";

import { useActionState } from "react";
import { sendResetLink, type LoginState } from "@/app/login/actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendResetLink,
    {}
  );

  if (state.sent) {
    return (
      <div className="panel">
        <h3>Check your inbox</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          If that address belongs to a member, a link is on its way. It
          opens your settings, where you set a new password.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel" style={{ maxWidth: 520 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Your email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send me a reset link"}
      </button>
    </form>
  );
}