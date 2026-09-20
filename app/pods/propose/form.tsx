"use client";

import { useActionState } from "react";
import { proposePod, type ProposalState } from "./actions";

export function ProposePodForm() {
  const [state, action, pending] = useActionState<ProposalState, FormData>(
    proposePod,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 680 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>What would you call it?</span>
        <input name="name" required placeholder="Raising a first round" />
      </label>

      <label className="field">
        <span>What is it for?</span>
        <textarea
          name="purpose"
          rows={4}
          required
          placeholder="What the few of you would be working towards, and what you would each bring"
        />
      </label>

      <div className="g2">
        <label className="field">
          <span>How often would you meet?</span>
          <select name="cadence" defaultValue="monthly">
            <option value="weekly">Every week</option>
            <option value="fortnightly">Every fortnight</option>
            <option value="monthly">Every month</option>
          </select>
        </label>
        <label className="field">
          <span>When would it end?</span>
          <input name="ends_on" type="date" />
          <span className="hint">
            A Pod that never ends becomes a group chat. Three to six months
            works.
          </span>
        </label>
      </div>

      <p className="muted small">
        The Global team reads it and comes back to you. If it goes ahead, you
        lead it.
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Propose it"}
      </button>
    </form>
  );
}