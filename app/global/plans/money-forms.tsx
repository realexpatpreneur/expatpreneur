"use client";

import { useActionState } from "react";
import { decideRefund, recordPayout, type PlanState } from "./actions";

export function RefundDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    decideRefund,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}
      <input type="hidden" name="request_id" value={id} />
      <label className="field">
        <span>A note</span>
        <input name="note" placeholder="Why, in a line" />
      </label>
      <div className="row">
        <button className="btn primary" name="decision" value="approved" disabled={pending}>
          Refund it
        </button>
        <button className="btn" name="decision" value="refused" disabled={pending}>
          Refuse
        </button>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>
        Refunding asks Stripe first. If Stripe refuses, nothing is marked
        here, so the two cannot disagree.
      </p>
    </form>
  );
}

export function PayoutForm({
  educators,
}: {
  educators: { id: string; name: string; owed: number; currency: string }[];
}) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    recordPayout,
    {}
  );

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;

  return (
    <form action={action} className="panel">
      <h3>Record a payout</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}

      <label className="field">
        <span>Educator</span>
        <select name="educator_id" defaultValue={educators[0]?.id}>
          {educators.map((educator) => (
            <option key={educator.id} value={educator.id}>
              {educator.name} ({(educator.owed / 100).toFixed(2)} {educator.currency})
            </option>
          ))}
        </select>
      </label>

      <div className="two">
        <label className="field">
          <span>From</span>
          <input name="period_start" type="date" defaultValue={monthStart} />
        </label>
        <label className="field">
          <span>To</span>
          <input name="period_end" type="date" defaultValue={today} />
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>What the courses took</span>
          <input name="gross" type="number" min={0} step="0.01" />
        </label>
        <label className="field">
          <span>Their share, percent</span>
          <input name="share" type="number" min={0} max={100} defaultValue={70} />
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue="EUR">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue="paid">
            <option value="due">Owed</option>
            <option value="paid">Paid</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Reference</span>
        <input name="reference" placeholder="The bank reference you used" />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Record it"}
      </button>
    </form>
  );
}