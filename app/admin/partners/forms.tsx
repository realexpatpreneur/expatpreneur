"use client";

import { useActionState } from "react";
import { proposePartneredEvent, type ProposeState } from "./actions";

export function ProposePartnerForm() {
  const [state, action, pending] = useActionState<ProposeState, FormData>(
    proposePartneredEvent,
    {}
  );

  return (
    <form action={action} className="panel">
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>The event</span>
        <input name="title" required placeholder="Founders dinner with a sponsor" />
      </label>

      <label className="field">
        <span>Partner</span>
        <input name="partner" required placeholder="A private bank" />
      </label>

      <label className="field">
        <span>What the partner gets</span>
        <textarea
          name="partner_gets"
          rows={2}
          required
          placeholder="A five minute welcome and logo on the invitation"
        />
      </label>

      <label className="field">
        <span>What members get</span>
        <textarea
          name="members_get"
          rows={2}
          required
          placeholder="Dinner paid by the partner"
        />
      </label>

      <p className="muted small">
        Do not agree anything with the partner until this comes back
        approved. The Global team attaches conditions to it.
      </p>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it to Global"}
      </button>
    </form>
  );
}