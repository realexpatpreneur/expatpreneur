"use client";

import { useActionState } from "react";
import { savePlan, type PlanState } from "./actions";

export function PlanForm({
  plan,
}: {
  plan: {
    id: string;
    slug: string;
    name: string;
    blurb: string | null;
    price_cents: number;
    currency: string;
    interval: string;
    stripe_price_id: string | null;
    features: string[];
    active: boolean;
  };
}) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    savePlan,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{plan.name}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}
      <input type="hidden" name="id" value={plan.id} />

      <label className="field">
        <span>Name</span>
        <input name="name" defaultValue={plan.name} required />
      </label>

      <label className="field">
        <span>The line under it</span>
        <input name="blurb" defaultValue={plan.blurb ?? ""} />
      </label>

      <div className="two">
        <label className="field">
          <span>Price</span>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={plan.price_cents / 100}
          />
        </label>
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={plan.currency}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>How often</span>
          <select name="interval" defaultValue={plan.interval}>
            <option value="none">Not charged</option>
            <option value="month">A month</option>
            <option value="year">A year</option>
          </select>
        </label>
        <label className="field">
          <span>Stripe price id</span>
          <input
            name="stripe_price_id"
            defaultValue={plan.stripe_price_id ?? ""}
            placeholder="price_..."
          />
          <span className="hint">
            What Stripe actually charges. If this and the price above
            disagree, Stripe wins and members are told one thing and charged
            another.
          </span>
        </label>
      </div>

      <label className="field">
        <span>What it gives you, one to a line</span>
        <textarea
          name="features"
          rows={7}
          defaultValue={plan.features.join("\n")}
        />
      </label>

      <label className="check">
        <input type="checkbox" name="active" defaultChecked={plan.active} />
        <span>
          <b>Shown publicly</b>
          <small>Off takes it off the membership page.</small>
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}