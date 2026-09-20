"use client";

import { useActionState } from "react";
import {
  saveGeneral,
  saveIntegration,
  saveSecurity,
  type SystemState,
} from "./actions";

export function GeneralForm({
  values,
}: {
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<SystemState, FormData>(
    saveGeneral,
    {}
  );

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <div className="g2">
        <label className="field">
          <span>Network name</span>
          <input name="network_name" defaultValue={values.network_name ?? ""} />
        </label>
        <label className="field">
          <span>Domain</span>
          <input name="domain" defaultValue={values.domain ?? ""} />
          <span className="hint">Placeholder until confirmed.</span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Default language</span>
          <select name="default_language" defaultValue={values.default_language ?? "English"}>
            <option>English</option>
          </select>
        </label>
        <label className="field">
          <span>Languages being prepared</span>
          <input
            name="languages_prepared"
            defaultValue={values.languages_prepared ?? ""}
          />
          <span className="hint">
            Noted here only. The platform itself is English.
          </span>
        </label>
      </div>

      <label className="field">
        <span>Support email</span>
        <input name="support_email" defaultValue={values.support_email ?? ""} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function IntegrationRow({
  name,
  settingKey,
  status,
  fixed,
}: {
  name: string;
  settingKey: string;
  status: string;
  fixed?: string;
}) {
  const [state, action, pending] = useActionState<SystemState, FormData>(
    saveIntegration,
    {}
  );

  return (
    <div className="li linkrow">
      <div>
        <b>{name}</b>
        <div className="muted small">{fixed ?? status}</div>
      </div>
      <div className="rowmeta">
        {fixed ? (
          <span className={`chip ${fixed === "Connected" ? "chip-mint" : ""}`}>
            {fixed}
          </span>
        ) : (
          <form action={action} className="row">
            {state.error ? <div className="flag hold">{state.error}</div> : null}
            <input type="hidden" name="key" value={settingKey} />
            <input
              name="value"
              defaultValue={status}
              placeholder="Not chosen yet"
              style={{ width: 160 }}
            />
            <button className="btn btn-ghost" type="submit" disabled={pending}>
              {pending ? "Saving" : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function SecurityForm({
  values,
}: {
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<SystemState, FormData>(
    saveSecurity,
    {}
  );

  const on = (key: string) => values[key] !== "off";

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <label className="check">
        <input
          type="checkbox"
          name="two_step_leaders"
          defaultChecked={on("two_step_leaders")}
        />
        <span>
          <b>Two step sign in for all leaders</b>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="two_step_members"
          defaultChecked={on("two_step_members")}
        />
        <span>
          <b>Two step sign in for members</b>
          <small>Optional for members</small>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="daily_backups"
          defaultChecked={on("daily_backups")}
        />
        <span>
          <b>Daily backups</b>
          <small>Kept for 30 days</small>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="access_ends_with_role"
          defaultChecked={on("access_ends_with_role")}
        />
        <span>
          <b>Remove access immediately when a role ends</b>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}