"use client";

import { useActionState } from "react";
import { submitApplication, type ApplyState } from "./actions";

type Village = { slug: string; name: string; status: string };

export function ApplyForm({ villages }: { villages: Village[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    submitApplication,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>


      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Your name</span>
        <input name="full_name" required autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label className="field">
        <span>Phone, with country code</span>
        <input name="phone" autoComplete="tel" />
      </label>

      <label className="field">
        <span>Which city do you live in?</span>
        <input name="city" required />
      </label>

      <label className="field">
        <span>Country</span>
        <input name="country" />
      </label>

      <label className="field">
        <span>Which Village is closest to you?</span>
        <select name="village" defaultValue="">
          <option value="">Somewhere else</option>
          {villages.map((village) => (
            <option key={village.slug} value={village.slug}>
              {village.name}
            </option>
          ))}
        </select>
        <span className="hint">
          If your city is not here yet, tell us and we will count you in.
        </span>
      </label>

      <label className="field">
        <span>Your business</span>
        <input name="business_name" />
      </label>

      <label className="field">
        <span>Industry</span>
        <input name="industry" />
      </label>

      <label className="field">
        <span>Nationalities</span>
        <input name="nationalities" placeholder="Separate with commas" />
        <span className="hint">Up to five.</span>
      </label>

      <label className="field">
        <span>Languages you speak</span>
        <input name="languages" placeholder="Separate with commas" />
      </label>

      <label className="field">
        <span>Tell us about your business</span>
        <textarea name="about_business" rows={4} />
      </label>

      <label className="field">
        <span>Why do you want to join?</span>
        <textarea name="why_join" rows={4} />
      </label>

      <label className="field">
        <span>What could you give the community?</span>
        <textarea name="contribute" rows={3} />
      </label>

      <label className="field">
        <span>How did you hear about us?</span>
        <input name="heard_about" />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send my request"}
      </button>
    </form>
  );
}