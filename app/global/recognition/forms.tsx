"use client";

import { useActionState } from "react";
import {
  saveAmounts,
  runRecognition,
  markRecognitionPaid,
  type RecognitionState,
} from "./actions";

export function AmountsForm({
  values,
}: {
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<RecognitionState, FormData>(
    saveAmounts,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Amounts by role</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <label className="field">
        <span>Local Admin</span>
        <input
          name="local_admin"
          type="number"
          min={0}
          step="1"
          defaultValue={values.recognition_local_admin ?? "0"}
          placeholder="For example, fuel for the month"
        />
      </label>

      <label className="field">
        <span>Circle Host</span>
        <input
          name="circle_host"
          type="number"
          min={0}
          step="1"
          defaultValue={values.recognition_circle_host ?? "0"}
        />
      </label>

      <label className="field">
        <span>Industry Lead and Pod Lead</span>
        <input
          name="lead"
          type="number"
          min={0}
          step="1"
          defaultValue={values.recognition_lead ?? "0"}
        />
      </label>

      <div className="g2">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={values.recognition_currency ?? "EUR"}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="field">
          <span>Paid from</span>
          <select
            name="paid_from"
            defaultValue={values.recognition_paid_from ?? "Membership and ticket income"}
          >
            <option>Membership and ticket income</option>
            <option>A fixed monthly budget</option>
          </select>
        </label>
      </div>

      <p className="muted small">
        Check with an accountant how to pay people properly in each country.
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function RunButton() {
  const [state, action, pending] = useActionState<RecognitionState, FormData>(
    runRecognition,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">{state.done}.</div> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Running" : "Run this month"}
      </button>
    </form>
  );
}

export function PaidForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RecognitionState, FormData>(
    markRecognitionPaid,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="payout_id" value={id} />
      <input name="reference" placeholder="Bank reference" style={{ width: 150 }} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Paid"}
      </button>
    </form>
  );
}