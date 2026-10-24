"use client";

import { useActionState } from "react";
import { Captcha } from "@/components/captcha";
import { suggestCity, type CityState } from "./actions";
import { Combo } from "@/components/combo";
import { CITIES } from "@/lib/lists/cities";
import { COUNTRIES } from "@/lib/lists/countries";

export function CitySuggestionForm({
  city = "",
  country = "",
}: {
  city?: string;
  country?: string;
}) {
  const [state, action, pending] = useActionState<CityState, FormData>(
    suggestCity,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 680 }}>
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>


      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <div className="g2">
        <Combo
          name="city"
          label="City"
          options={CITIES}
          value={city}
          allowNew
          required
        />
        <Combo
          name="country"
          label="Country"
          options={COUNTRIES}
          value={country}
          required
        />
      </div>

      <label className="field">
        <span>Your name</span>
        <input name="name" autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" />
        <span className="hint">
          So we can tell you when the Village opens. Nothing else is sent.
        </span>
      </label>

      <label className="check">
        <input type="checkbox" name="offers_admin" />
        <span>
          <b>I would be interested in helping run it</b>
          <small>
            A Village needs someone local who knows people and turns up.
          </small>
        </span>
      </label>

      <label className="field">
        <span>Tell us about yourself</span>
        <textarea name="about" rows={3} />
      </label>

      <label className="field">
        <span>Who do you already know in that city?</span>
        <textarea name="network" rows={3} />
      </label>

      <Captcha />

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}