"use client";

import { useActionState } from "react";
import { suggestStory, type StoryState } from "./actions";

export function StoryForm() {
  const [state, action, pending] = useActionState<StoryState, FormData>(
    suggestStory,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 640 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>Who is it about?</span>
        <select name="about" defaultValue="me">
          <option value="me">Me</option>
          <option value="another member">Another member</option>
          <option value="a collaboration">Something two of us did together</option>
        </select>
      </label>

      <label className="field">
        <span>What is the story?</span>
        <textarea
          name="body"
          rows={5}
          required
          placeholder="What happened, and why it is worth reading"
        />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it to the team"}
      </button>
    </form>
  );
}