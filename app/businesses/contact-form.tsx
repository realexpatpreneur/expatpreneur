"use client";

import { useActionState } from "react";
import { contactBusiness, type EnquiryState } from "./enquiry";

export function ContactBusinessForm({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    contactBusiness,
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
      <input type="hidden" name="slug" value={slug} />

      <label className="field">
        <span>Your name</span>
        <input name="name" required autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea name="body" rows={4} required />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : `Send message`}
      </button>

      <p className="muted small" style={{ marginTop: 10 }}>
        This goes straight to {name}. ExpatPreneurs does not take part in the
        transaction.
      </p>
    </form>
  );
}