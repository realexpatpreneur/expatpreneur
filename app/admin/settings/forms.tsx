"use client";

import { useActionState } from "react";
import {
  saveVillageSettings,
  writeToGlobal,
  type VillageSettingsState,
} from "./actions";

export function VillageSettingsForm({
  village,
}: {
  village: {
    id: string;
    name: string;
    timezone: string;
    visitor_places: number;
    summary: string | null;
  };
}) {
  const [state, action, pending] = useActionState<VillageSettingsState, FormData>(
    saveVillageSettings,
    {}
  );

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="village_id" value={village.id} />

      <div className="g2">
        <label className="field">
          <span>Village name</span>
          <input name="name" defaultValue={village.name} required />
        </label>
        <label className="field">
          <span>Time zone</span>
          <select name="timezone" defaultValue={village.timezone}>
            <option value="Asia/Dubai">Gulf Standard Time</option>
            <option value="Europe/Lisbon">Western European Time</option>
            <option value="Europe/Paris">Central European Time</option>
            <option value="Europe/Madrid">Central European Time (Madrid)</option>
          </select>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Circle capacity</span>
          <input value="50 members" readOnly disabled />
          <span className="hint">
            The same for every Village. The Village itself has no limit.
          </span>
        </label>
        <label className="field">
          <span>Default visitor places per event</span>
          <input
            name="visitor_places"
            type="number"
            min={0}
            max={50}
            defaultValue={village.visitor_places ?? 6}
          />
        </label>
      </div>

      <label className="field">
        <span>Village description</span>
        <textarea name="summary" rows={3} defaultValue={village.summary ?? ""} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function ContactGlobalForm() {
  const [state, action, pending] = useActionState<VillageSettingsState, FormData>(
    writeToGlobal,
    {}
  );

  if (state.done === "sent") {
    return (
      <div className="panel">
        <h3>Sent</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          It is with the Global team, and they have been told. It sits with
          the suggestions so it does not get lost in somebody&apos;s inbox.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel">
      <h3>Write to the Global team</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>Subject</span>
        <input name="title" required placeholder="What this is about" />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea
          name="body"
          rows={5}
          required
          placeholder="Something you need, something that is not working, or something worth copying in another Village"
        />
      </label>

      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it"}
      </button>
    </form>
  );
}