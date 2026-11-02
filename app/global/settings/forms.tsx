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

      {/* Four checkboxes used to sit here: two step sign in for leaders,
          two step for members, daily backups "Kept for 30 days", and
          remove access when a role ends. All four wrote a settings row
          and were read by nothing but their own tick. There is no second
          factor, TOTP or verification code anywhere in app, lib or
          components, so two of them described a feature that does not
          exist, and the Integrations tab on this same screen already has
          a panel admitting its own unkeyed rows "are notes, because
          nothing on the platform reads them yet" while this tab had none.

          They are statements of what is true now rather than switches,
          because a switch that cannot be off is a lie either way. */}
      <div className="panel panel-wash">
        <h3 style={{ fontSize: 14 }}>How sign in and access work</h3>
        <ul className="plain" style={{ marginTop: 8 }}>
          <li>
            Signing in is by emailed link, or by a password if somebody set
            one in their settings. There is no second step, for leaders or
            for members, and nothing here can turn one on.
          </li>
          <li>
            Access ends with a role, always. A role that carries membership
            ending is treated as a membership ending, which closes the
            member side on the next page they open. It is not optional.
          </li>
          <li>
            Backups belong to the database host rather than to this
            platform, so they are neither set nor reported here.
          </li>
        </ul>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}