"use client";

import { useActionState } from "react";
import {
  saveAccount,
  saveProfile,
  saveNotificationPrefs,
  savePrivacy,
  askAboutMyData,
  unblockMember,
  leaveCommunity,
  type SettingsState,
} from "./actions";
import { Uploader } from "@/components/uploader";

// ---------------------------------------------------------------- Account

export function AccountForm({
  account,
}: {
  account: {
    email: string;
    phone: string | null;
    time_zone: string;
    language: string;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveAccount,
    {}
  );

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <div className="g2">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" defaultValue={account.email} />
        </label>
        <label className="field">
          <span>Phone (WhatsApp)</span>
          <input name="phone" defaultValue={account.phone ?? ""} />
          <span className="hint">
            Used by Local Admins to add you to your groups. Never shown on
            your profile.
          </span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" placeholder={"\u2022".repeat(8)} />
          <span className="hint">
            Leave it empty to keep signing in by emailed link.
          </span>
        </label>
        <label className="field">
          <span>Time zone</span>
          <select name="time_zone" defaultValue={account.time_zone}>
            <option>Gulf Standard Time (Dubai)</option>
            <option>Western European Time (Lisbon)</option>
            <option>Central European Time (Paris)</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Language</span>
        <select name="language" defaultValue={account.language}>
          <option>English</option>
        </select>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------- Profile

export function ProfileSettingsForm({
  profile,
}: {
  profile: {
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    business_name: string | null;
    industry: string | null;
    bio: string | null;
    can_help_with: string | null;
    looking_for: string | null;
    languages: string[] | null;
    markets_known: string[] | null;
    lived_in: string[] | null;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveProfile,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Your profile</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <Uploader
        name="avatar_url"
        folder="avatars"
        label="Photograph"
        current={profile.avatar_url}
      />

      <label className="field">
        <span>Your name</span>
        <input name="full_name" required defaultValue={profile.full_name} />
      </label>

      <label className="field">
        <span>Headline</span>
        <input name="headline" defaultValue={profile.headline ?? ""} />
      </label>

      <div className="g2">
        <label className="field">
          <span>Business</span>
          <input name="business_name" defaultValue={profile.business_name ?? ""} />
        </label>
        <label className="field">
          <span>Industry</span>
          <input name="industry" defaultValue={profile.industry ?? ""} />
        </label>
      </div>

      <label className="field">
        <span>About you</span>
        <textarea name="bio" rows={4} defaultValue={profile.bio ?? ""} />
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
        <span className="hint">Members only. Never public.</span>
      </label>

      <label className="field">
        <span>Languages</span>
        <input
          name="languages"
          defaultValue={(profile.languages ?? []).join(", ")}
        />
      </label>

      <div className="g2">
        <label className="field">
          <span>Markets you know</span>
          <input
            name="markets_known"
            defaultValue={(profile.markets_known ?? []).join(", ")}
          />
        </label>
        <label className="field">
          <span>Where you have lived</span>
          <input
            name="lived_in"
            defaultValue={(profile.lived_in ?? []).join(", ")}
          />
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------- Notifications

export function NotificationForm({
  prefs,
}: {
  prefs: {
    replies: boolean;
    messages: boolean;
    events: boolean;
    announcements: boolean;
    digest: boolean;
    newsletter: boolean;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveNotificationPrefs,
    {}
  );

  const rows: [keyof typeof prefs, string, string][] = [
    ["replies", "Replies to my Asks and Offers", "Email and push"],
    [
      "messages",
      "New messages",
      "Email and push. Important because daily chat is on WhatsApp.",
    ],
    ["events", "Event reminders", "The day before, in your time zone"],
    ["announcements", "Village announcements", ""],
    ["digest", "Weekly digest", "A summary every Monday"],
    [
      "newsletter",
      "Newsletter and news",
      "Marketing emails, separate from service messages",
    ],
  ];

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      {rows.map(([key, label, hint]) => (
        <label className="check" key={key}>
          <input type="checkbox" name={key} defaultChecked={prefs[key]} />
          <span>
            <b>{label}</b>
            {hint ? <small>{hint}</small> : null}
          </span>
        </label>
      ))}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------- Privacy

export function PrivacyForm({
  privacy,
}: {
  privacy: {
    public_profile: boolean;
    show_business: boolean;
    findable_elsewhere: boolean;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    savePrivacy,
    {}
  );

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">Saved.</div> : null}

      <label className="check">
        <input
          type="checkbox"
          name="public_profile"
          defaultChecked={privacy.public_profile}
        />
        <span>
          <b>Show my public profile on the website</b>
          <small>
            Business, offers, expat journey, nationalities and languages
          </small>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="show_business"
          defaultChecked={privacy.show_business}
        />
        <span>
          <b>Show my business in the public marketplace</b>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="findable_elsewhere"
          defaultChecked={privacy.findable_elsewhere}
        />
        <span>
          <b>Let members in other Villages find me</b>
        </span>
      </label>

      <p className="muted small" style={{ marginTop: 6 }}>
        What you are looking for is always members only. Your email and phone
        are never public.
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function MyDataButtons() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    askAboutMyData,
    {}
  );

  if (state.done === "asked") {
    return (
      <div className="flag ok">
        Asked. The Global team has it and will be in touch.
      </div>
    );
  }

  return (
    <form action={action} className="row">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <button className="btn btn-ghost" name="kind" value="export" disabled={pending}>
        Export my data
      </button>
      <button className="btn btn-ghost" name="kind" value="delete" disabled={pending}>
        Delete my account
      </button>
    </form>
  );
}

export function UnblockButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [, action, pending] = useActionState<SettingsState, FormData>(
    unblockMember,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="blocked_id" value={id} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Unblocking" : `Unblock ${name}`}
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
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <label className="field">
        <span>Type LEAVE to confirm</span>
        <input name="confirm" placeholder="LEAVE" />
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Leaving" : "Leave the community"}
      </button>
    </form>
  );
}