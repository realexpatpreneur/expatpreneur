"use client";

import { useActionState } from "react";
import { checkStatus, type StatusState } from "./actions";

const meaning: Record<string, string> = {
  "with us": "It has arrived and is waiting to be read.",
  "with the Village":
    "The Local Admins of the city you named are reading it. This is where most of the time goes.",
  "with the Global team": "Your Village recommended you. The final word is being given.",
  "on the waiting list":
    "Not a no. Your city is full or still forming, and you will hear when a place comes up.",
  approved: "You are in. Check your email for the link that signs you in.",
  closed: "This one was decided and is closed. You are welcome to ask again later.",
};

export function StatusForm() {
  const [state, action, pending] = useActionState<StatusState, FormData>(
    checkStatus,
    {}
  );

  if (state.answer) {
    return (
      <div className="panel">
        <h3>{state.answer}</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          {meaning[state.answer] ?? ""}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel" style={{ maxWidth: 560 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>The email address you used</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label className="field">
        <span>Your reference</span>
        <input name="reference" required placeholder="EP-XXXXX" />
        <span className="hint">
          It is in the email we sent when you asked, and on the page
          straight after you sent the form.
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Checking" : "Check"}
      </button>
    </form>
  );
}