"use client";

import { useActionState } from "react";
import { sendReport, type ReportState } from "./actions";

export function ReportForm({
  people,
  subjectId,
}: {
  people: { id: string; full_name: string }[];
  subjectId?: string;
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(
    sendReport,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 680 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Who is this about?</span>
        <select name="subject_id" defaultValue={subjectId ?? ""}>
          <option value="">Not about one person</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Where did it happen?</span>
        <input
          name="context"
          placeholder="A message, a post, an event, the WhatsApp group"
        />
      </label>

      <label className="field">
        <span>What happened?</span>
        <textarea name="body" rows={6} required />
        <span className="hint">
          As much or as little as you want to write. Dates and where it happened
          help.
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it"}
      </button>
    </form>
  );
}