"use client";

import { useActionState } from "react";
import { tellMeWhenItOpens, type NetworkState } from "./actions";

export function NotifyButton({
  villageId,
  already,
}: {
  villageId: string;
  already: boolean;
}) {
  const [state, action, pending] = useActionState<NetworkState, FormData>(
    tellMeWhenItOpens,
    {}
  );

  if (already || state.done === "asked") {
    return (
      <p className="muted small" style={{ marginTop: 6 }}>
        You will be told when it opens.
      </p>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Tell me when it opens"}
      </button>
    </form>
  );
}