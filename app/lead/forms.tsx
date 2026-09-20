"use client";

import { useActionState } from "react";
import { openRoomForMine, saveMyGroup, saveMyPod, type LeadState } from "./actions";

export function OpenRoomForm({
  things,
}: {
  things: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(
    openRoomForMine,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Open a room</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>For</span>
        <select name="thing" defaultValue={things[0]?.value}>
          {things.map((thing) => (
            <option key={thing.value} value={thing.value}>
              {thing.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" required placeholder="Monthly catch up" />
      </label>

      <div className="g2">
        <label className="field">
          <span>Date</span>
          <input name="date" type="date" required />
        </label>
        <label className="field">
          <span>Time</span>
          <input name="time" type="time" required />
        </label>
      </div>

      <label className="field">
        <span>Time zone</span>
        <select name="timezone" defaultValue="Asia/Dubai">
          <option value="Asia/Dubai">Dubai</option>
          <option value="Europe/Lisbon">Lisbon</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Europe/Madrid">Madrid</option>
          <option value="UTC">UTC</option>
        </select>
      </label>

      <label className="field">
        <span>What it is for</span>
        <textarea name="purpose" rows={2} />
      </label>

      <label className="check">
        <input type="checkbox" name="lobby" defaultChecked />
        <span>
          <b>Use a lobby</b>
          <small>You let people in one by one.</small>
        </span>
      </label>

      <div className="g2">
        <label className="field">
          <span>Room size</span>
          <input name="max_participants" type="number" min={2} defaultValue={50} />
        </label>
        <label className="field">
          <span>Recording</span>
          <select name="recording" defaultValue="off">
            <option value="off">Do not record</option>
            <option value="on_request">Record if I start it</option>
          </select>
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Opening" : "Schedule it"}
      </button>
    </form>
  );
}

export function GroupForm({
  group,
}: {
  group: { id: string; name: string; description: string | null; whatsapp_url: string | null };
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(
    saveMyGroup,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="group_id" value={group.id} />
      <label className="field">
        <span>What it is for</span>
        <textarea name="description" rows={2} defaultValue={group.description ?? ""} />
      </label>
      <label className="field">
        <span>WhatsApp group link</span>
        <input name="whatsapp_url" defaultValue={group.whatsapp_url ?? ""} />
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function PodForm({
  pod,
}: {
  pod: {
    id: string;
    name: string;
    purpose: string | null;
    whatsapp_url: string | null;
    cadence: string;
  };
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(
    saveMyPod,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}
      <input type="hidden" name="pod_id" value={pod.id} />
      <label className="field">
        <span>What it is for</span>
        <textarea name="purpose" rows={2} defaultValue={pod.purpose ?? ""} />
      </label>
      <div className="g2">
        <label className="field">
          <span>How often</span>
          <select name="cadence" defaultValue={pod.cadence}>
            <option value="weekly">weekly</option>
            <option value="fortnightly">fortnightly</option>
            <option value="monthly">monthly</option>
          </select>
        </label>
        <label className="field">
          <span>WhatsApp group link</span>
          <input name="whatsapp_url" defaultValue={pod.whatsapp_url ?? ""} />
        </label>
      </div>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}