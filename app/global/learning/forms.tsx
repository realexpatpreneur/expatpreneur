"use client";

import { useActionState } from "react";
import { reviewCourse, type ReviewState } from "./actions";

export function ReviewButtons({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    reviewCourse,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="course_id" value={id} />
      <label className="field">
        <span>A note for the educator</span>
        <input name="note" placeholder="What to change, or why it is going out" />
      </label>
      <div className="row">
        <button className="btn primary" name="decision" value="approved" disabled={pending}>
          Approve it
        </button>
        <button className="btn" name="decision" value="pending" disabled={pending}>
          Send it back
        </button>
        <button className="btn" name="decision" value="refused" disabled={pending}>
          Refuse it
        </button>
      </div>
    </form>
  );
}