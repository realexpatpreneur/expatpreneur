"use client";

import { useActionState } from "react";
import { saveGroup, savePod, type GroupAdminState } from "./actions";

type Person = { id: string; full_name: string };
type Village = { id: string; name: string };

export function GroupForm({
  people,
  group,
}: {
  people: Person[];
  group?: {
    id: string;
    name: string;
    industry: string;
    description: string | null;
    lead_id: string | null;
    whatsapp_url: string | null;
    status: string;
  };
}) {
  const [state, action, pending] = useActionState<GroupAdminState, FormData>(
    saveGroup,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{group ? group.name : "New Industry Group"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <div className="g2" style={{ marginTop: 10 }}>
        <label className="field">
          <span>Name</span>
          <input name="name" required defaultValue={group?.name ?? ""} />
        </label>
        <label className="field">
          <span>Industry</span>
          <input name="industry" required defaultValue={group?.industry ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>What it is for</span>
        <textarea name="description" rows={2} defaultValue={group?.description ?? ""} />
      </label>

      <div className="g2">
        <label className="field">
          <span>Lead</span>
          <select name="lead_id" defaultValue={group?.lead_id ?? ""}>
            <option value="">Nobody yet</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={group?.status ?? "forming"}>
            <option value="forming">Forming</option>
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>WhatsApp group link</span>
        <input name="whatsapp_url" defaultValue={group?.whatsapp_url ?? ""} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function PodForm({
  people,
  villages,
  pod,
}: {
  people: Person[];
  villages: Village[];
  pod?: {
    id: string;
    name: string;
    purpose: string | null;
    village_id: string | null;
    lead_id: string | null;
    capacity: number;
    cadence: string;
    whatsapp_url: string | null;
    status: string;
  };
}) {
  const [state, action, pending] = useActionState<GroupAdminState, FormData>(
    savePod,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{pod ? pod.name : "New Pod"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {pod ? <input type="hidden" name="id" value={pod.id} /> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Name</span>
        <input name="name" required defaultValue={pod?.name ?? ""} />
      </label>

      <label className="field">
        <span>What it is for</span>
        <textarea name="purpose" rows={2} defaultValue={pod?.purpose ?? ""} />
      </label>

      <div className="g2">
        <label className="field">
          <span>Village</span>
          <select name="village_id" defaultValue={pod?.village_id ?? ""}>
            <option value="">Every Village</option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Lead</span>
          <select name="lead_id" defaultValue={pod?.lead_id ?? ""}>
            <option value="">Nobody yet</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Seats</span>
          <input
            name="capacity"
            type="number"
            min={3}
            max={12}
            defaultValue={pod?.capacity ?? 8}
          />
          <span className="hint">Between three and twelve.</span>
        </label>
        <label className="field">
          <span>How often</span>
          <select name="cadence" defaultValue={pod?.cadence ?? "monthly"}>
            <option value="weekly">weekly</option>
            <option value="fortnightly">fortnightly</option>
            <option value="monthly">monthly</option>
          </select>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>WhatsApp group link</span>
          <input name="whatsapp_url" defaultValue={pod?.whatsapp_url ?? ""} />
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={pod?.status ?? "forming"}>
            <option value="forming">Forming</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}