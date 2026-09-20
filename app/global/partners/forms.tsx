"use client";

import { useActionState } from "react";
import { decidePartneredEvent, type PartnerState } from "./actions";

export function PartnerDecision({
  id,
  conditions,
}: {
  id: string;
  conditions: string | null;
}) {
  const [state, action, pending] = useActionState<PartnerState, FormData>(
    decidePartneredEvent,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="partner_id" value={id} />
      <label className="field">
        <span>Conditions</span>
        <textarea
          name="conditions"
          rows={2}
          defaultValue={
            conditions ??
            "No member data is shared with the partner. No sales pitch at the table."
          }
        />
      </label>
      <div className="row">
        <button
          className="btn btn-primary"
          name="decision"
          value="approved"
          disabled={pending}
        >
          Approve with conditions
        </button>
        <button className="btn btn-ghost" name="decision" value="declined" disabled={pending}>
          Decline
        </button>
      </div>
    </form>
  );
}