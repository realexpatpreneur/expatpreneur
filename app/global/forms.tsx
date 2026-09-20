"use client";

import { useActionState } from "react";
import {
  saveVillage,
  assignRole,
  endRole,
  updateReport,
  updateCity,
  type GlobalState,
} from "./actions";

export function VillageForm({
  village,
}: {
  village?: {
    id: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    status: string;
    summary: string | null;
  };
}) {
  const [state, action, pending] = useActionState<GlobalState, FormData>(
    saveVillage,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{village ? village.name : "Open a Village"}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {village ? <input type="hidden" name="id" value={village.id} /> : null}

      <div className="two" style={{ marginTop: 10 }}>
        <label className="field">
          <span>Name</span>
          <input name="name" required defaultValue={village?.name ?? ""} />
        </label>
        <label className="field">
          <span>City</span>
          <input name="city" required defaultValue={village?.city ?? ""} />
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>Country</span>
          <input name="country" required defaultValue={village?.country ?? ""} />
        </label>
        <label className="field">
          <span>Time zone</span>
          <input
            name="timezone"
            defaultValue={village?.timezone ?? "UTC"}
            placeholder="Europe/Paris"
          />
        </label>
      </div>

      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={village?.status ?? "exploring"}>
          <option value="exploring">Being explored</option>
          <option value="launching">Launching</option>
          <option value="open">Open</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <label className="field">
        <span>One line for the public site</span>
        <textarea name="summary" rows={2} defaultValue={village?.summary ?? ""} />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function RoleForm({
  people,
  villages,
}: {
  people: { id: string; full_name: string }[];
  villages: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<GlobalState, FormData>(
    assignRole,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Give someone a role</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Member</span>
        <select name="profile_id" defaultValue={people[0]?.id}>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Role</span>
        <select name="role" defaultValue="local_admin">
          <option value="local_admin">Local Admin</option>
          <option value="circle_host">Circle Host</option>
          <option value="industry_lead">Industry Lead</option>
          <option value="pod_lead">Pod Lead</option>
          <option value="educator">Educator</option>
          <option value="global_admin">Global Admin</option>
        </select>
      </label>

      <label className="field">
        <span>Village</span>
        <select name="scope_id" defaultValue={villages[0]?.id}>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
        <span className="hint">Ignored for a Global Admin.</span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Give the role"}
      </button>
    </form>
  );
}

export function EndRole({ roleId }: { roleId: string }) {
  const [, action, pending] = useActionState<GlobalState, FormData>(endRole, {});

  return (
    <form action={action}>
      <input type="hidden" name="role_id" value={roleId} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "End"}
      </button>
    </form>
  );
}

export function ReportForm({
  reportId,
  status,
  note,
}: {
  reportId: string;
  status: string;
  note: string | null;
}) {
  const [state, action, pending] = useActionState<GlobalState, FormData>(
    updateReport,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="report_id" value={reportId} />
      <div className="two">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="new">New</option>
            <option value="in_progress">Being handled</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="field">
          <span>What was done</span>
          <input name="note" defaultValue={note ?? ""} />
        </label>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function CityForm({
  cityId,
  status,
  note,
}: {
  cityId: string;
  status: string;
  note: string | null;
}) {
  const [, action, pending] = useActionState<GlobalState, FormData>(
    updateCity,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="city_id" value={cityId} />
      <div className="two">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="watching">Watching</option>
            <option value="exploring">Exploring</option>
            <option value="not_now">Not now</option>
          </select>
        </label>
        <label className="field">
          <span>Note</span>
          <input name="note" defaultValue={note ?? ""} />
        </label>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}