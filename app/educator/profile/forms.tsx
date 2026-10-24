"use client";

import { useActionState } from "react";
import { saveEducatorProfile, type EducatorProfileState } from "./actions";
import { Combo } from "@/components/combo";
import { COUNTRIES } from "@/lib/lists/countries";
import { LANGUAGES } from "@/lib/lists/languages";

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
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

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

      <Combo
        name="teaches_in"
        label="Languages you teach in"
        options={LANGUAGES}
        multi
        value={profile?.teaches_in ?? []}
      />

      <Combo
        name="markets"
        label="Markets you know"
        options={COUNTRIES}
        multi
        value={profile?.markets ?? []}
      />

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}