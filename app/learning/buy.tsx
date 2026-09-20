"use client";

import { useActionState } from "react";
import { buyCourse, askForRefund, type BuyState } from "./checkout";

export function BuyButton({
  slug,
  label,
}: {
  slug: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<BuyState, FormData>(
    buyCourse,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="slug" value={slug} />
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Opening checkout" : label}
      </button>
    </form>
  );
}


export function RefundForm({
  purchaseId,
  slug,
}: {
  purchaseId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<BuyState, FormData>(
    askForRefund,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="purchase_id" value={purchaseId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="field">
        <span>What went wrong?</span>
        <input name="reason" required placeholder="Not what you expected, or a problem" />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending" : "Ask for a refund"}
      </button>
    </form>
  );
}