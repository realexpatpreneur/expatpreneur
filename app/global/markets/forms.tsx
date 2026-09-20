"use client";

import { useActionState } from "react";
import { savePathway, saveStep, type PathwayAdminState } from "./actions";

export function PathwayForm({
  pathway,
}: {
  pathway?: {
    id: string;
    title: string;
    country: string;
    city: string | null;
    summary: string | null;
    body: string | null;
    industry: string | null;
    tier: string;
    status: string;
  };
}) {
  const [state, action, pending] = useActionState<PathwayAdminState, FormData>(
    savePathway,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{pathway ? pathway.title : "New pathway"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {pathway ? <input type="hidden" name="id" value={pathway.id} /> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Title</span>
        <input
          name="title"
          required
          defaultValue={pathway?.title ?? ""}
          placeholder="Selling into Saudi Arabia"
        />
      </label>

      <div className="g2">
        <label className="field">
          <span>Country</span>
          <input name="country" required defaultValue={pathway?.country ?? ""} />
        </label>
        <label className="field">
          <span>City</span>
          <input name="city" defaultValue={pathway?.city ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>Industry</span>
        <input
          name="industry"
          defaultValue={pathway?.industry ?? ""}
          placeholder="Leave empty if it applies to any trade"
        />
      </label>

      <label className="field">
        <span>One line</span>
        <input name="summary" defaultValue={pathway?.summary ?? ""} />
      </label>

      <label className="field">
        <span>The lay of the land</span>
        <textarea name="body" rows={4} defaultValue={pathway?.body ?? ""} />
      </label>

      <div className="g2">
        <label className="field">
          <span>Who can see the steps</span>
          <select name="tier" defaultValue={pathway?.tier ?? "all"}>
            <option value="all">Every member</option>
            <option value="paid">Paid members only</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={pathway?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function StepForm({
  pathwayId,
  nextPosition,
  step,
}: {
  pathwayId: string;
  nextPosition: number;
  step?: {
    id: string;
    position: number;
    title: string;
    body: string | null;
    watch_out: string | null;
    link: string | null;
    typical_cost: string | null;
    typical_time: string | null;
  };
}) {
  const [state, action, pending] = useActionState<PathwayAdminState, FormData>(
    saveStep,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{step ? `${step.position}. ${step.title}` : "New step"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="pathway_id" value={pathwayId} />
      {step ? <input type="hidden" name="id" value={step.id} /> : null}

      <div className="g2" style={{ marginTop: 10 }}>
        <label className="field">
          <span>Position</span>
          <input
            name="position"
            type="number"
            min={1}
            defaultValue={step?.position ?? nextPosition}
          />
        </label>
        <label className="field">
          <span>Title</span>
          <input name="title" required defaultValue={step?.title ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>What to do</span>
        <textarea name="body" rows={4} defaultValue={step?.body ?? ""} />
      </label>

      <label className="field">
        <span>What people get wrong</span>
        <textarea name="watch_out" rows={2} defaultValue={step?.watch_out ?? ""} />
        <span className="hint">
          This is usually the most valuable line on the page.
        </span>
      </label>

      <div className="g2">
        <label className="field">
          <span>Usually costs</span>
          <input name="typical_cost" defaultValue={step?.typical_cost ?? ""} />
        </label>
        <label className="field">
          <span>Usually takes</span>
          <input name="typical_time" defaultValue={step?.typical_time ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>Link</span>
        <input name="link" defaultValue={step?.link ?? ""} placeholder="https://" />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}