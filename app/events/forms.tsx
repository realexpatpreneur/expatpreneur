"use client";

import { useActionState } from "react";
import {
  registerForEvent,
  cancelRegistration,
  registerAsGuest,
  type RegisterState,
} from "./actions";

export function RegisterForm({
  eventId,
  slug,
  requiresApproval,
  isVisitor,
  label,
  waitingList = false,
}: {
  eventId: string;
  slug: string;
  requiresApproval: boolean;
  isVisitor: boolean;
  label: string;
  waitingList?: boolean;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerForEvent,
    {}
  );

  if (state.done === "confirmed") {
    return (
      <div className="flag ok">
        You are registered. A reminder comes the day before and an hour before
        it starts.
      </div>
    );
  }
  if (state.done === "waiting") {
    return (
      <div className="flag ok">
        You are on the list. If a place comes free you get it, and you will
        hear by email.
      </div>
    );
  }
  if (state.done === "pending") {
    return (
      <div className="flag ok">
        Your request is with the host. You will hear within a day.
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="requires_approval" value={requiresApproval ? "1" : "0"} />
      <input type="hidden" name="is_visitor" value={isVisitor ? "1" : "0"} />
      <input type="hidden" name="waiting_list" value={waitingList ? "1" : "0"} />

      {isVisitor ? (
        <label className="field">
          <span>What brings you to this Village?</span>
          <input name="note" placeholder="Exploring the market, visiting family" />
          <span className="hint">
            The Local Admins see this and can introduce you to the right people.
          </span>
        </label>
      ) : null}

      <label className="field">
        <span>Anything the host should know?</span>
        <input name="dietary" placeholder="Dietary needs, accessibility, arriving late" />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Registering" : label}
      </button>
    </form>
  );
}

export function CancelForm({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    cancelRegistration,
    {}
  );

  if (state.done === "cancelled") {
    return <div className="flag hold">Your place has been released.</div>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Cancelling" : "Cancel my place"}
      </button>
    </form>
  );
}

export function GuestRegisterForm({
  eventId,
  slug,
  requiresApproval,
}: {
  eventId: string;
  slug: string;
  requiresApproval: boolean;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerAsGuest,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Register</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="requires_approval" value={requiresApproval ? "1" : "0"} />

      <label className="field" style={{ marginTop: 10 }}>
        <span>Your name</span>
        <input name="guest_name" required autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="guest_email" type="email" required autoComplete="email" />
        <span className="hint">
          The address and the full details are sent here.
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Registering" : "Register"}
      </button>
    </form>
  );
}