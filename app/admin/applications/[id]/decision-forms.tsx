"use client";

import { useActionState } from "react";
import {
  approveApplication,
  waitlistApplication,
  declineApplication,
  type DecisionState,
} from "./actions";

type Circle = { id: string; name: string; places_left: number };

export function ApproveForm({
  id,
  circles,
  warning,
}: {
  id: string;
  circles: Circle[];
  warning: string | null;
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    approveApplication,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Approve</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {warning ? <div className="notice bad">{warning}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Place in a Circle</span>
        <select name="circle_id" defaultValue={circles[0]?.id ?? ""}>
          <option value="">Decide later</option>
          {circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.places_left} places left
            </option>
          ))}
        </select>
        <span className="hint">
          Approving creates the account, emails the invitation, and adds a
          WhatsApp task for the group.
        </span>
      </label>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Approving" : "Approve and send the invitation"}
      </button>
    </form>
  );
}

export function WaitlistForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    waitlistApplication,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Waitlist</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Note for the other admins</span>
        <textarea name="note" rows={3} />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Move to the waitlist"}
      </button>
    </form>
  );
}

export function DeclineForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    declineApplication,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Do not recommend</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Reason</span>
        <textarea name="reason" rows={3} required />
        <span className="hint">
          Kept internally. The applicant is told the decision, not the reason.
        </span>
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Record the decision"}
      </button>
    </form>
  );
}