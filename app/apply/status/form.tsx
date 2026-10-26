"use client";

import { useActionState } from "react";
import {
  checkStatus,
  requestNewInvitation,
  type StatusState,
  type ResendState,
} from "./actions";

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
    const lapsed = state.answer === "approved" && state.invite === "expired";
    const used = state.answer === "approved" && state.invite === "joined";
    return (
      <div className="panel">
        <h3>{state.answer}</h3>
        <p className="muted small" style={{ marginTop: 8 }}>
          {used
            ? "Your account is already made. Sign in rather than looking for the link."
            : lapsed
              ? "Your place still stands. The link we sent has run out, which happens, and a new one takes a moment."
              : (meaning[state.answer] ?? "")}
        </p>
        {lapsed && state.email && state.reference ? (
          <ResendInvitation email={state.email} reference={state.reference} />
        ) : null}
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
// A fresh link for somebody whose acceptance outlived the email. The
// decision is not made again; only the link is.
function ResendInvitation({
  email,
  reference,
}: {
  email: string;
  reference: string;
}) {
  const [state, action, pending] = useActionState<ResendState, FormData>(
    requestNewInvitation,
    {}
  );

  if (state.sent) {
    return (
      <p className="muted small" style={{ marginTop: 12 }}>
        Sent. It is on its way to {email}, and your place is held for another
        fourteen days.
      </p>
    );
  }

  return (
    <form action={action} style={{ marginTop: 12 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="reference" value={reference} />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send me a new link"}
      </button>
    </form>
  );
}
