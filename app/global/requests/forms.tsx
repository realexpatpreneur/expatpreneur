"use client";

import { useActionState } from "react";
import { decideOnPod, handleDataRequest, type RequestState } from "./actions";

export function PodDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(
    decideOnPod,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="proposal_id" value={id} />
      <label className="field">
        <span>A note for them</span>
        <input name="note" placeholder="Optional" />
      </label>
      <div className="row">
        <button className="btn primary" name="decision" value="actioned" disabled={pending}>
          Make the Pod
        </button>
        <button className="btn" name="decision" value="discussing" disabled={pending}>
          Talking about it
        </button>
        <button className="btn" name="decision" value="not_now" disabled={pending}>
          Not now
        </button>
      </div>
    </form>
  );
}

export function DataDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(
    handleDataRequest,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="request_id" value={id} />
      <label className="field">
        <span>A note</span>
        <input name="note" placeholder="What was sent, or why not" />
      </label>
      <div className="row">
        <button className="btn" name="status" value="in_progress" disabled={pending}>
          Working on it
        </button>
        <button className="btn primary" name="status" value="done" disabled={pending}>
          Done
        </button>
        <button className="btn" name="status" value="refused" disabled={pending}>
          Refused
        </button>
      </div>
    </form>
  );
}