"use client";

import { useActionState } from "react";
import {
  sendMessage,
  requestConnection,
  respondToConnection,
  type MessageState,
} from "./actions";

export function MessageForm({ recipientId }: { recipientId: string }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(
    sendMessage,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Sent.</div> : null}
      <input type="hidden" name="recipient_id" value={recipientId} />
      <label className="field">
        <span>Your message</span>
        <textarea name="body" rows={3} required />
      </label>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}

export function ConnectionRequestForm({ recipientId }: { recipientId: string }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(
    requestConnection,
    {}
  );

  if (state.done === "requested") {
    return (
      <div className="notice good">
        Your request is with them. They decide whether to open the door.
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="recipient_id" value={recipientId} />
      <label className="field">
        <span>Why are you getting in touch?</span>
        <textarea
          name="reason"
          rows={3}
          required
          placeholder="What you are working on, and what you hope they can help with"
        />
        <span className="hint">They see this before they decide.</span>
      </label>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send a request"}
      </button>
    </form>
  );
}

export function ConnectionDecision({ requestId }: { requestId: string }) {
  const [, action, pending] = useActionState<MessageState, FormData>(
    respondToConnection,
    {}
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="request_id" value={requestId} />
      <button className="btn primary" name="decision" value="accepted" disabled={pending}>
        Accept
      </button>
      <button className="btn" name="decision" value="declined" disabled={pending}>
        Not now
      </button>
    </form>
  );
}