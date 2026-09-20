"use client";

import { useActionState } from "react";
import { savePhotoUse, retirePhoto, saveRotation, type PhotoState } from "./actions";

export function PhotoForm({
  people,
}: {
  people: { id: string; full_name: string }[];
}) {
  const [state, action, pending] = useActionState<PhotoState, FormData>(
    savePhotoUse,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Record a photograph</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}

      <label className="field">
        <span>Who is in it</span>
        <input name="who" required placeholder="Their name, as it should read" />
      </label>

      <label className="field">
        <span>Which member</span>
        <select name="profile_id" defaultValue="">
          <option value="">Nobody in particular, or a wide shot</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
        <span className="hint">
          Linking it means the photograph comes down when they leave.
        </span>
      </label>

      <label className="field">
        <span>Where it appears</span>
        <input name="appears_on" required placeholder="Home page, Dubai Village page" />
      </label>

      <div className="two">
        <label className="field">
          <span>Taken</span>
          <input name="taken_on" type="date" />
        </label>
        <label className="field">
          <span>Review by</span>
          <input name="review_by" type="date" />
        </label>
      </div>

      <label className="field">
        <span>Permission</span>
        <select name="consent" defaultValue="waiting">
          <option value="signed">Signed</option>
          <option value="waiting">Waiting for a signature</option>
          <option value="no_faces">No faces in focus</option>
        </select>
      </label>

      <label className="field">
        <span>Note</span>
        <input name="consent_note" placeholder="Where the signed permission is kept" />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Record it"}
      </button>
    </form>
  );
}

export function RetireButton({ id }: { id: string }) {
  const [, action, pending] = useActionState<PhotoState, FormData>(
    retirePhoto,
    {}
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="id" value={id} />
      <input name="reason" placeholder="Why" style={{ width: 140 }} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Taking down" : "Take it down"}
      </button>
    </form>
  );
}

export function RotationForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<PhotoState, FormData>(
    saveRotation,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Rotation</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}

      <label className="field">
        <span>Rotate member photographs</span>
        <select name="rotation" defaultValue={values.photo_rotation ?? "Every six months"}>
          <option>Every three months</option>
          <option>Every six months</option>
          <option>Once a year</option>
        </select>
      </label>

      <label className="field">
        <span>Next rotation</span>
        <input name="next" defaultValue={values.photo_next ?? ""} placeholder="March 2027" />
      </label>

      <label className="field">
        <span>Who checks</span>
        <select name="checked_by" defaultValue={values.photo_checked_by ?? "Global team"}>
          <option>Global team</option>
          <option>Local Admins</option>
        </select>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}