"use client";

import { useActionState } from "react";
import { saveTemplate, sendTestEmail, type EmailState } from "./actions";

export function TemplateForm({
  template,
}: {
  template: {
    key: string;
    name: string;
    sent_when: string;
    subject: string;
    body: string;
    button_label: string | null;
    button_path: string | null;
    active: boolean;
  };
}) {
  const [state, action, pending] = useActionState<EmailState, FormData>(
    saveTemplate,
    {}
  );
  const [testState, testAction, testing] = useActionState<EmailState, FormData>(
    sendTestEmail,
    {}
  );

  return (
    <div className="stack">
      <form action={action} className="panel">
        {state.error ? <div className="flag hold">{state.error}</div> : null}
        <input type="hidden" name="key" value={template.key} />

        <label className="field">
          <span>Subject</span>
          <input name="subject" defaultValue={template.subject} required />
        </label>

        <label className="field">
          <span>Body</span>
          <textarea name="body" rows={10} defaultValue={template.body} required />
          <span className="hint">
            A blank line starts a new paragraph.
          </span>
        </label>

        <div className="g2">
          <label className="field">
            <span>Button</span>
            <input
              name="button_label"
              defaultValue={template.button_label ?? ""}
              placeholder="Leave empty for no button"
            />
          </label>
          <label className="field">
            <span>Button goes to</span>
            <input
              name="button_path"
              defaultValue={template.button_path ?? ""}
              placeholder="/home"
            />
          </label>
        </div>

        <label className="check">
          <input type="checkbox" name="active" defaultChecked={template.active} />
          <span>
            <b>Send this email</b>
            <small>
              Off means the platform falls back to the wording written in the
              code.
            </small>
          </span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save"}
        </button>
      </form>

      <form action={testAction} className="panel panel-wash">
        <h3>Send me a test</h3>
        {testState.error ? (
          <div className="flag hold">{testState.error}</div>
        ) : null}
        {testState.done ? (
          <div className="flag ok">Sent to your own address.</div>
        ) : null}
        <p className="muted small" style={{ marginTop: 6 }}>
          Goes to you, with the placeholders filled in with example values.
        </p>
        <input type="hidden" name="key" value={template.key} />
        <button className="btn btn-ghost" type="submit" disabled={testing}>
          {testing ? "Sending" : "Send me a test"}
        </button>
      </form>
    </div>
  );
}