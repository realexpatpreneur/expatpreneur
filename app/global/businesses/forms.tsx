"use client";

import { useActionState } from "react";
import { hideListing, type ListingState } from "./actions";

export function HideButton({
  id,
  hidden,
}: {
  id: string;
  hidden: boolean;
}) {
  const [state, action, pending] = useActionState<ListingState, FormData>(
    hideListing,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="business_id" value={id} />
      <input type="hidden" name="hide" value={hidden ? "0" : "1"} />
      {hidden ? null : (
        <input name="reason" placeholder="Why" style={{ width: 160 }} />
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : hidden ? "Put it back" : "Take it down"}
      </button>
    </form>
  );
}