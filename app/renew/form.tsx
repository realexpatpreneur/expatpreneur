"use client";

import { useActionState } from "react";
import { answerRenewal, type RenewState } from "./actions";

export function RenewalForm({ renewalId }: { renewalId: string }) {
  const [state, action, pending] = useActionState<RenewState, FormData>(
    answerRenewal,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 680 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="renewal_id" value={renewalId} />

      <label className="check">
        <input type="radio" name="answer" value="staying" defaultChecked />
        <span>
          <b>I am staying</b>
          <small>
            Another year in your Village and your Circle, with whatever that
            takes from you.
          </small>
        </span>
      </label>

      <label className="check">
        <input type="radio" name="answer" value="leaving" />
        <span>
          <b>I am stepping away</b>
          <small>
            No hard feelings and no exit interview. Your place goes to someone
            on the waiting list.
          </small>
        </span>
      </label>

      <label className="field">
        <span>Anything you want to tell us?</span>
        <textarea name="note" rows={3} />
        <span className="hint">
          Read by your Local Admin. This is where honest answers are worth more
          than polite ones.
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Send my answer"}
      </button>
    </form>
  );
}