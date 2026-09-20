"use client";

import { useActionState } from "react";
import { completeProfile, type WelcomeState } from "./actions";

type Profile = {
  full_name: string;
  headline: string | null;
  business_name: string | null;
  industry: string | null;
  bio: string | null;
  can_help_with: string | null;
  looking_for: string | null;
  languages: string[] | null;
  markets_known: string[] | null;
  lived_in: string[] | null;
  public_profile: boolean;
};

export function WelcomeForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<WelcomeState, FormData>(
    completeProfile,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>Your name</span>
        <input name="full_name" defaultValue={profile.full_name} required />
      </label>

      <label className="field">
        <span>One line about you</span>
        <input
          name="headline"
          defaultValue={profile.headline ?? ""}
          placeholder="Brand designer building a studio in Dubai"
        />
      </label>

      <label className="field">
        <span>Your business</span>
        <input name="business_name" defaultValue={profile.business_name ?? ""} />
      </label>

      <label className="field">
        <span>Industry</span>
        <input name="industry" defaultValue={profile.industry ?? ""} />
      </label>

      <label className="field">
        <span>A little more about you</span>
        <textarea name="bio" rows={3} defaultValue={profile.bio ?? ""} />
      </label>

      <label className="field">
        <span>What you can help other members with</span>
        <textarea
          name="can_help_with"
          rows={2}
          defaultValue={profile.can_help_with ?? ""}
        />
      </label>

      <label className="field">
        <span>What you are looking for</span>
        <textarea
          name="looking_for"
          rows={2}
          defaultValue={profile.looking_for ?? ""}
        />
        <span className="hint">Members see this. The public never does.</span>
      </label>

      <label className="field">
        <span>Languages you speak</span>
        <input
          name="languages"
          defaultValue={(profile.languages ?? []).join(", ")}
          placeholder="Separate with commas"
        />
      </label>

      <label className="field">
        <span>Markets you know</span>
        <input
          name="markets_known"
          defaultValue={(profile.markets_known ?? []).join(", ")}
          placeholder="Countries you have done business in"
        />
      </label>

      <label className="field">
        <span>Where you have lived</span>
        <input
          name="lived_in"
          defaultValue={(profile.lived_in ?? []).join(", ")}
          placeholder="Your expat journey, in order"
        />
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="public_profile"
          defaultChecked={profile.public_profile}
        />
        <span>
          <b>Show my profile on the public site</b>
          <small>
            Only your name, headline, business and journey. Never your email,
            phone or what you are looking for.
          </small>
        </span>
      </label>

      <label className="check">
        <input type="checkbox" name="values" />
        <span>
          <b>I have read how this community works</b>
          <small>
            We help before we sell. Nobody pitches in the groups. What is said
            in the Circle stays in the Circle.
          </small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Finish and join my Circle"}
      </button>
    </form>
  );
}