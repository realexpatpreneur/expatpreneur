"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "./subscribe";

export function SubscribeForm({ source }: { source?: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(
    subscribe,
    {}
  );

  return (
    <form action={action}>
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="source" value={source ?? "media"} />

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it to me"}
      </button>
    </form>
  );
}