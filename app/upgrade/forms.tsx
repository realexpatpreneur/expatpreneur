"use client";

import { useActionState } from "react";
import {
  startMembershipCheckout,
  startTicketCheckout,
  cancelMembership,
  openBillingPortal,
  type CheckoutState,
} from "./actions";

export function UpgradeButton({
  label,
  monthly,
  yearly,
}: {
  label: string;
  monthly?: string | null;
  yearly?: string | null;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    startMembershipCheckout,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      {monthly && yearly ? (
        <div className="choicegrid" style={{ marginBottom: 12 }}>
          <label className="radio">
            <input type="radio" name="interval" value="month" defaultChecked />
            <span>
              <b>{monthly}</b>
              <span className="hint" style={{ display: "block" }}>
                every month
              </span>
            </span>
          </label>
          <label className="radio">
            <input type="radio" name="interval" value="year" />
            <span>
              <b>{yearly}</b>
              <span className="hint" style={{ display: "block" }}>
                every year
              </span>
            </span>
          </label>
        </div>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Opening checkout" : label}
      </button>
    </form>
  );
}

export function CancelMembershipButton() {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    cancelMembership,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Cancel at the end of the period"}
      </button>
    </form>
  );
}

export function TicketButton({
  eventId,
  slug,
  label,
}: {
  eventId: string;
  slug: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    startTicketCheckout,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Opening checkout" : label}
      </button>
    </form>
  );
}


export function BillingPortalButton() {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    openBillingPortal,
    {}
  );

  return (
    <form action={action} style={{ marginTop: 10 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Opening" : "Change your card or see invoices"}
      </button>
    </form>
  );
}