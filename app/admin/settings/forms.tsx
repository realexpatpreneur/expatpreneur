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
    summary: string | null;
    welcome_message: string | null;
    whatsapp_url: string | null;
    meeting_note: string | null;
    quiet_days: number;
  };
}) {
  const [state, action, pending] = useActionState<VillageSettingsState, FormData>(
    saveVillageSettings,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{village.name}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}
      <input type="hidden" name="village_id" value={village.id} />

      <label className="field">
        <span>What this Village is</span>
        <textarea name="summary" rows={3} defaultValue={village.summary ?? ""} />
        <span className="hint">
          The line people read on the public Villages page.
        </span>
      </label>

      <label className="field">
        <span>What a new member reads first</span>
        <textarea
          name="welcome_message"
          rows={5}
          defaultValue={village.welcome_message ?? ""}
          placeholder="Who you are, what happens here, and what to do in the first week"
        />
        <span className="hint">
          This is the one piece of writing most worth your time. It is the
          first thing somebody sees after they are let in.
        </span>
      </label>

      <label className="field">
        <span>The Village WhatsApp group</span>
        <input
          name="whatsapp_url"
          defaultValue={village.whatsapp_url ?? ""}
          placeholder="https://chat.whatsapp.com/..."
        />
        <span className="hint">
          Members see this after they join. Circle groups are set on the
          Circles page.
        </span>
      </label>

      <label className="field">
        <span>When you meet</span>
        <input
          name="meeting_note"
          defaultValue={village.meeting_note ?? ""}
          placeholder="First Tuesday of the month, usually somewhere in Marina"
        />
      </label>

      <label className="field">
        <span>Count somebody quiet after how many days?</span>
        <input
          name="quiet_days"
          type="number"
          min={14}
          max={180}
          defaultValue={village.quiet_days ?? 45}
        />
        <span className="hint">
          This is what member care uses. Shorter means you chase people
          sooner, which is not always kinder.
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
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
      {state.error ? <div className="notice bad">{state.error}</div> : null}

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

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it"}
      </button>
    </form>
  );
}