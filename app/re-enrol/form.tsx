"use client";

import { useActionState } from "react";
import { confirmPlace, notForMe, type ReEnrolState } from "./actions";
import { Ic } from "@/components/icon";

type Invite = {
  full_name: string;
  phone: string | null;
  email: string | null;
};

export function ReEnrolForm({
  token,
  invite,
  villageName,
  cityName,
}: {
  token: string;
  invite: Invite;
  villageName: string;
  cityName: string;
}) {
  const [state, action, pending] = useActionState<ReEnrolState, FormData>(
    confirmPlace,
    {}
  );
  const [, leave, leaving] = useActionState<ReEnrolState, FormData>(
    notForMe,
    {}
  );

  return (
    <>
      <form action={action} className="panel">
        {state.error ? <div className="flag hold">{state.error}</div> : null}

        <div className="flag ok" style={{ marginBottom: 16 }}>
          <Ic name="star" />
          <span>
            <b>Founding member.</b> Your founding member badge, and your Village
            membership at no cost, as for every member.
          </span>
        </div>

        <input type="hidden" name="token" value={token} />

        <div className="formgrid">
          <label className="field">
            <span>Full name</span>
            <input name="full_name" defaultValue={invite.full_name} required />
          </label>

          <label className="field">
            <span>Phone (WhatsApp)</span>
            <input name="phone" defaultValue={invite.phone ?? ""} />
            <span className="hint">
              From the WhatsApp group. Never shown publicly.
            </span>
          </label>

          <label className="field full">
            <span>Email</span>
            <input
              name="email"
              type="email"
              defaultValue={invite.email ?? ""}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Currently based in</span>
            <input name="city" defaultValue={cityName} />
          </label>

          <label className="field">
            <span>Business name</span>
            <input name="business_name" />
          </label>

          <label className="field">
            <span>Create a password</span>
            <input name="password" type="password" required minLength={8} />
            <span className="hint">Eight characters or more.</span>
          </label>

          <label className="field">
            <span>Repeat the password</span>
            <input name="password2" type="password" required minLength={8} />
          </label>
        </div>

        <label className="check" style={{ marginTop: 14 }}>
          <input type="checkbox" name="staying" defaultChecked />
          <span>
            <b>
              I am still building my business and want to stay in the community
            </b>
          </span>
        </label>

        <label className="check">
          <input type="checkbox" name="values" defaultChecked />
          <span>
            <b>I agree to the community values, terms and privacy policy</b>
          </span>
        </label>

        <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving" : "Continue to my profile"}
          </button>
        </div>
      </form>

      <form action={leave} style={{ marginTop: 14 }}>
        <input type="hidden" name="token" value={token} />
        <button className="btn btn-ghost" type="submit" disabled={leaving}>
          {leaving ? "Saving" : "Not for me anymore"}
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          No hard feelings, and no explanation needed. We will take you out of
          the {villageName} WhatsApp group.
        </p>
      </form>
    </>
  );
}