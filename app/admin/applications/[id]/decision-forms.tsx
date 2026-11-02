"use client";

import { useActionState } from "react";
import {
  approveApplication,
  waitlistApplication,
  declineApplication,
  recommendApplication,
  type DecisionState,
} from "./actions";

type Circle = { id: string; name: string; places_left: number };

export function ApproveForm({
  id,
  circles,
  warning,
  isGlobal,
}: {
  id: string;
  circles: Circle[];
  warning: string | null;
  isGlobal: boolean;
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    approveApplication,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Approve</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {warning ? <div className="flag hold">{warning}</div> : null}
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
          Approving creates the account and sends the invitation. The WhatsApp
          task is raised when their membership is paid for, because adding
          somebody to a group before they have joined and taking them back out
          is worse than never adding them.
        </span>
      </label>

      {/* The balance limit refuses this approval. Only the Global team
          can decide to go ahead, and it is recorded against them on the
          row rather than waved through invisibly. */}
      {warning && isGlobal ? (
        <label className="field" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <input type="checkbox" name="over_the_limit" />
          <span>
            Approve anyway, over the balance limit
            <small style={{ display: "block", color: "#6B7683" }}>
              Recorded against your name on this request.
            </small>
          </span>
        </label>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
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
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Note for the other admins</span>
        <textarea name="note" rows={3} />
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
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
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Reason</span>
        <textarea name="reason" rows={3} required />
        <span className="hint">
          Kept internally. The applicant is told the decision, not the reason.
        </span>
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Record the decision"}
      </button>
    </form>
  );
}
// The stage /apply/status has always described and nothing could reach
// until 0084. A Local Admin stopped by the balance limit, or unsure for
// any other reason, hands the decision up rather than sitting on it.
export function RecommendForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    recommendApplication,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Recommend to the Global team</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span>Why it is theirs to decide</span>
        <textarea name="note" rows={3} />
        <span className="hint">
          The Global team is told it is waiting, and the status the applicant
          sees reads that their Village has recommended them.
        </span>
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Sending" : "Hand it to the Global team"}
      </button>
    </form>
  );
}
