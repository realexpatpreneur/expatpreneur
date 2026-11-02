"use client";

import { useActionState } from "react";
import { savePlan, saveVillageRate, type PlanState } from "./actions";

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
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="id" value={plan.id} />

      <label className="field">
        <span>Name</span>
        <input name="name" defaultValue={plan.name} required />
      </label>

      <label className="field">
        <span>The line under it</span>
        <input name="blurb" defaultValue={plan.blurb ?? ""} />
      </label>

      {/* Stripe price id used to sit here too, with a hint warning that
          if it and the price disagreed "Stripe wins and members are told
          one thing and charged another". Nothing read that column
          anywhere, and the checkout builds its charge inline from the
          Village rate, so the drift it warned about could not happen. It
          is gone.

          Price and currency stay, because components/blocks.tsx does
          print them, for a plan that has no per-Village rate. The paid
          plan ignores them: it reads the Village's own figures, which are
          further down this page. */}
      <div className="g2">
        <label className="field">
          <span>Price</span>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={plan.price_cents / 100}
          />
          <span className="hint">
            {plan.slug === "paid"
              ? "Not used for this plan. The rate comes from the member's own Village, below."
              : "Only for a plan with no per-Village rate. Zero reads as By application."}
          </span>
        </label>
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={plan.currency}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>How often</span>
        <select name="interval" defaultValue={plan.interval}>
          <option value="none">Not charged</option>
          <option value="month">A month</option>
          <option value="year">A year</option>
        </select>
      </label>

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

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}
// A Village's own rates, in its own currency, which is what the public
// membership page prints and what the checkout charges. No screen has
// ever written this table, so until now the only way to change a price
// was SQL.
export function VillageRateForm({
  rate,
  planId,
}: {
  rate: {
    village_id: string;
    village_name: string;
    currency: string;
    month_cents: number;
    year_cents: number;
    founding_month_cents: number | null;
    founding_year_cents: number | null;
    founding_seats: number | null;
    founding_days: number | null;
    founding_taken: number | null;
    founding_open: boolean | null;
  };
  planId: string;
}) {
  const [state, action, pending] = useActionState<PlanState, FormData>(
    saveVillageRate,
    {}
  );

  const amount = (cents: number | null) => (cents === null ? "" : cents / 100);

  return (
    <form action={action} className="panel">
      <h3>{rate.village_name}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="village_id" value={rate.village_id} />
      <input type="hidden" name="plan_id" value={planId} />

      <label className="field">
        <span>Currency</span>
        <select name="currency" defaultValue={rate.currency}>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="AED">AED</option>
          <option value="GBP">GBP</option>
        </select>
      </label>

      <div className="g2">
        <label className="field">
          <span>A month</span>
          <input name="month" type="number" min={0} step="0.01" required
            defaultValue={amount(rate.month_cents)} />
        </label>
        <label className="field">
          <span>A year</span>
          <input name="year" type="number" min={0} step="0.01" required
            defaultValue={amount(rate.year_cents)} />
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Founding, a month</span>
          <input name="founding_month" type="number" min={0} step="0.01"
            defaultValue={amount(rate.founding_month_cents)} />
        </label>
        <label className="field">
          <span>Founding, a year</span>
          <input name="founding_year" type="number" min={0} step="0.01"
            defaultValue={amount(rate.founding_year_cents)} />
        </label>
      </div>
      <span className="hint">
        Leave both empty for a Village with no founding rate. Empty is not
        the same as zero.
      </span>

      <div className="g2">
        <label className="field">
          <span>Founding places</span>
          <input name="founding_seats" type="number" min={0} step="1"
            defaultValue={rate.founding_seats ?? 50} />
          <span className="hint">
            {rate.founding_taken ?? 0} taken so far.
          </span>
        </label>
        <label className="field">
          <span>Founding days</span>
          <input name="founding_days" type="number" min={0} step="1"
            defaultValue={rate.founding_days ?? 90} />
          <span className="hint">
            From the day paid membership opened in this Village.
          </span>
        </label>
      </div>

      <p className="muted small">
        {rate.founding_open
          ? "The founding rate is open here."
          : "The founding rate is closed here, so new members pay the standard rate."}
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save these rates"}
      </button>
    </form>
  );
}
