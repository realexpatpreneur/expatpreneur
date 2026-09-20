"use client";

import { useActionState } from "react";
import { saveEducatorProfile, type EducatorProfileState } from "./actions";

export function EducatorProfileForm({
  profile,
  name,
}: {
  profile: {
    headline: string | null;
    about: string | null;
    teaches_in: string[];
    markets: string[];
  } | null;
  name: string;
}) {
  const [state, action, pending] = useActionState<EducatorProfileState, FormData>(
    saveEducatorProfile,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 760 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}

      <label className="field">
        <span>Name</span>
        <input value={name} readOnly disabled />
        <span className="hint">
          Your name comes from your member profile.
        </span>
      </label>

      <label className="field">
        <span>Headline</span>
        <input
          name="headline"
          defaultValue={profile?.headline ?? ""}
          placeholder="Company setup and market entry in the Gulf"
        />
      </label>

      <label className="field">
        <span>About you</span>
        <textarea
          name="about"
          rows={4}
          defaultValue={profile?.about ?? ""}
          placeholder="What you have actually done, not what you can talk about"
        />
      </label>

      <label className="field">
        <span>Languages you teach in</span>
        <input
          name="teaches_in"
          defaultValue={(profile?.teaches_in ?? []).join(", ")}
          placeholder="English, French"
        />
      </label>

      <label className="field">
        <span>Markets you know</span>
        <input
          name="markets"
          defaultValue={(profile?.markets ?? []).join(", ")}
          placeholder="United Arab Emirates, Saudi Arabia"
        />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}