"use client";

import { useActionState } from "react";
import { Captcha } from "@/components/captcha";
import { subscribe, type SubscribeState } from "./subscribe";

// The prototype's newsletter row: one input, one mint button.
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

      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="source" value={source ?? "media"} />

      <div className="row">
        <label className="input">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Your email address"
            aria-label="Email address"
          />
        </label>
        <button className="btn btn-mint" type="submit" disabled={pending}>
          {pending ? "Sending" : "Subscribe"}
        </button>
      </div>

      {/* The only public form that writes to a mailing list, and the
          only one that had no check on it. Without this anybody can put
          somebody else's address on the list. */}
      <Captcha />
    </form>
  );
}