"use client";

import { useActionState } from "react";
import { requestTransfer, type TransferState } from "./actions";

export function TransferForm({
  villages,
}: {
  villages: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<TransferState, FormData>(
    requestTransfer,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 640 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Where are you going?</span>
        <select name="to_village" defaultValue="">
          <option value="">Choose a Village</option>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
        <span className="hint">
          If your new city has no Village yet, suggest it instead and we will
          count you in when it opens.
        </span>
      </label>

      <label className="field">
        <span>When?</span>
        <input name="moving_on" type="date" />
      </label>

      <label className="field">
        <span>Anything they should know?</span>
        <textarea
          name="note"
          rows={3}
          placeholder="What you are doing there, and who you already know"
        />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Ask to transfer"}
      </button>
    </form>
  );
}