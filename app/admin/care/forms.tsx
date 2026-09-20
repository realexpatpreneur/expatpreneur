"use client";

import { useActionState } from "react";
import { openRenewalRound, noteOnRenewal, type CareState } from "./actions";

export function OpenRoundForm({ suggested }: { suggested: string }) {
  const [state, action, pending] = useActionState<CareState, FormData>(
    openRenewalRound,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Open a re-enrolment round</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <label className="field" style={{ marginTop: 10 }}>
        <span>Cycle</span>
        <input name="cycle" defaultValue={suggested} />
        <span className="hint">
          Everyone active in your Village is asked once. Nobody is asked twice
          for the same cycle.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Asking" : "Ask everyone"}
      </button>
    </form>
  );
}

export function RenewalNote({
  renewalId,
  status,
  note,
}: {
  renewalId: string;
  status: string;
  note: string | null;
}) {
  const [, action, pending] = useActionState<CareState, FormData>(
    noteOnRenewal,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="renewal_id" value={renewalId} />
      <div className="g2">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="pending">Waiting</option>
            <option value="staying">Staying</option>
            <option value="leaving">Leaving</option>
            <option value="no_answer">No answer</option>
          </select>
        </label>
        <label className="field">
          <span>Note</span>
          <input name="admin_note" defaultValue={note ?? ""} />
        </label>
      </div>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}