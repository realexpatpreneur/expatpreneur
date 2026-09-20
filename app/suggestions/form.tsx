"use client";

import { useActionState } from "react";
import { sendSuggestion, type SuggestionState } from "./actions";

export function SuggestionForm({ villageName }: { villageName: string | null }) {
  const [state, action, pending] = useActionState<SuggestionState, FormData>(
    sendSuggestion,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>What is it about?</span>
        <select name="about" defaultValue="village">
          <option value="village">
            {villageName ? `${villageName} Village` : "My Village"}
          </option>
          <option value="community">The whole community</option>
        </select>
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" required placeholder="One line that says what it is" />
      </label>

      <label className="field">
        <span>Your suggestion</span>
        <textarea
          name="body"
          rows={6}
          required
          placeholder="What would you change, and what would it fix?"
        />
      </label>

      <h3 style={{ marginBottom: 10 }}>How would you like to send it?</h3>

      <label className="check">
        <input type="radio" name="how" value="named" defaultChecked />
        <span>
          <b>Send it as yourself</b>
          <small>
            The admins see your name and can reply and thank you.
          </small>
        </span>
      </label>

      <label className="check">
        <input type="radio" name="how" value="anonymous" />
        <span>
          <b>Send it anonymously</b>
          <small>
            Your name is not stored with the suggestion, so nobody can reply to
            it or ask you more about it.
          </small>
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send suggestion"}
      </button>
    </form>
  );
}