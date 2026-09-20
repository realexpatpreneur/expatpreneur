"use client";

import { useActionState } from "react";
import { followPathway, markStep, type PathwayState } from "./actions";

export function FollowForm({
  pathwayId,
  slug,
  country,
}: {
  pathwayId: string;
  slug: string;
  country: string;
}) {
  const [state, action, pending] = useActionState<PathwayState, FormData>(
    followPathway,
    {}
  );

  if (state.done === "following") {
    return (
      <div className="flag ok">
        You are following this. Work down the steps and tick them off.
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="pathway_id" value={pathwayId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="field">
        <span>What are you trying to do in {country}?</span>
        <input name="note" placeholder="Find a distributor, open an entity, first clients" />
        <span className="hint">
          Only you and the Global team see this. It is how pathways get better.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Follow this pathway"}
      </button>
    </form>
  );
}

export function StepDone({
  stepId,
  slug,
  done,
}: {
  stepId: string;
  slug: string;
  done: boolean;
}) {
  const [, action, pending] = useActionState<PathwayState, FormData>(
    markStep,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="step_id" value={stepId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="done" value={done ? "1" : "0"} />
      <button
        className={`btn ${done ? "btn-mint" : ""}`}
        type="submit"
        disabled={pending}
      >
        {pending ? "Saving" : done ? "Done" : "Mark as done"}
      </button>
    </form>
  );
}