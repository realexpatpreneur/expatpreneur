"use client";

import { useActionState } from "react";
import { sendEnquiry, type ContactState } from "./actions";

type Village = { slug: string; name: string };

export function ContactForm({
  kind,
  villages,
}: {
  kind: string;
  villages: Village[];
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendEnquiry,
    {}
  );

  const general = kind === "general";

  return (
    <form action={action} className="panel">
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="kind" value={kind} />

      <div className="formgrid">
        <label className="field">
          <span>Full name</span>
          <input name="full_name" required autoComplete="name" />
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>

        {general ? (
          <label className="field full">
            <span>Village</span>
            <select name="village" defaultValue="">
              <option value="">Not sure</option>
              {villages.map((village) => (
                <option key={village.slug} value={village.slug}>
                  {village.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field full">
            <span>Organisation</span>
            <input name="organisation" />
          </label>
        )}

        <label className="field full">
          <span>Message</span>
          <textarea name="message" rows={5} required />
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}