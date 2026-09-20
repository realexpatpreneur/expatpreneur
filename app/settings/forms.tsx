"use client";

import { useActionState } from "react";
import { saveProfile, leaveCommunity, type SettingsState } from "./actions";
import { Uploader } from "@/components/uploader";

type Profile = {
  full_name: string;
  headline: string | null;
  business_name: string | null;
  industry: string | null;
  bio: string | null;
  can_help_with: string | null;
  looking_for: string | null;
  phone: string | null;
  languages: string[] | null;
  markets_known: string[] | null;
  lived_in: string[] | null;
  public_profile: boolean;
  avatar_url: string | null;
};

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveProfile,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Your profile</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Saved.</div> : null}

      <Uploader
        name="avatar_url"
        bucket="avatars"
        label="Your photograph"
        hint="A face makes the Directory worth opening. Square works best."
        current={profile.avatar_url}
        shape="round"
      />

      <label className="field">
        <span>Your name</span>
        <input name="full_name" required defaultValue={profile.full_name} />
      </label>

      <label className="field">
        <span>One line about you</span>
        <input name="headline" defaultValue={profile.headline ?? ""} />
      </label>

      <div className="two">
        <label className="field">
          <span>Your business</span>
          <input name="business_name" defaultValue={profile.business_name ?? ""} />
        </label>
        <label className="field">
          <span>Industry</span>
          <input name="industry" defaultValue={profile.industry ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>About you</span>
        <textarea name="bio" rows={3} defaultValue={profile.bio ?? ""} />
      </label>

      <label className="field">
        <span>What you can help with</span>
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
        <span>Phone</span>
        <input name="phone" defaultValue={profile.phone ?? ""} />
        <span className="hint">
          Only your Local Admin sees this, for the WhatsApp groups.
        </span>
      </label>

      <label className="field">
        <span>Languages</span>
        <input name="languages" defaultValue={(profile.languages ?? []).join(", ")} />
      </label>

      <label className="field">
        <span>Markets you know</span>
        <input
          name="markets_known"
          defaultValue={(profile.markets_known ?? []).join(", ")}
        />
      </label>

      <label className="field">
        <span>Where you have lived</span>
        <input name="lived_in" defaultValue={(profile.lived_in ?? []).join(", ")} />
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

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function LeaveForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    leaveCommunity,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <label className="field">
        <span>Type LEAVE to confirm</span>
        <input name="confirm" placeholder="LEAVE" />
        <span className="hint">
          Your profile comes down, you are taken out of the groups, and nothing
          you posted is deleted unless you ask.
        </span>
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Leaving" : "Leave ExpatPreneurs"}
      </button>
    </form>
  );
}