"use client";

import { useActionState } from "react";
import { updateSuggestion, type SuggestionAdminState } from "./actions";

const statuses = [
  ["new", "New"],
  ["read", "Read"],
  ["discussing", "Being discussed"],
  ["actioned", "Actioned"],
  ["not_now", "Not for now"],
];

export function SuggestionAdminForm({
  id,
  status,
  note,
  toGlobal,
}: {
  id: string;
  status: string;
  note: string | null;
  toGlobal: boolean;
}) {
  const [state, action, pending] = useActionState<SuggestionAdminState, FormData>(
    updateSuggestion,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Status</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />

      <label className="field" style={{ marginTop: 10 }}>
        <span>Where it stands</span>
        <select name="status" defaultValue={status}>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Note for the other admins</span>
        <textarea name="note" rows={3} defaultValue={note ?? ""} />
      </label>

      <label className="check">
        <input type="checkbox" name="to_global" defaultChecked={toGlobal} />
        <span>
          <b>Send it to the Global team</b>
          <small>For anything that affects more than one Village.</small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}