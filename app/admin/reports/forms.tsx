"use client";

import { useActionState } from "react";
import { handleReport, type ReportState } from "./actions";

export function ReportDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(
    handleReport,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="report_id" value={id} />
      <label className="field">
        <span>What you did</span>
        <input name="note" placeholder="Kept private. Not for Village channels." />
      </label>
      <div className="row">
        <button className="btn btn-ghost" name="status" value="in_progress" disabled={pending}>
          Looking at it
        </button>
        <button className="btn btn-ghost" name="status" value="closed" disabled={pending}>
          Handled here
        </button>
        <button className="btn btn-primary" name="status" value="escalated" disabled={pending}>
          Send it to Global
        </button>
      </div>
    </form>
  );
}