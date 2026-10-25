"use client";

import { useActionState } from "react";
import {
  importList,
  remind,
  setDeadline,
  closeOut,
  setComplimentary,
  type ReEnrolAdminState,
} from "./actions";

export function ImportForm({ villageId }: { villageId: string }) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    importList,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">{state.done}.</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <label className="field">
        <span>Paste the list</span>
        <textarea
          name="people"
          rows={6}
          placeholder={"Karim Aziz, +971 55 222 1100\nLina Haddad, lina@example.com"}
        />
        <span className="hint">
          One person per line: the name first, then a phone number or an
          email, separated by a comma.
        </span>
      </label>

      <label className="check">
        <input type="checkbox" name="complimentary" />
        <span>
          <b>These people hold Village Membership without paying</b>
          <small>
            For the Global team, Local Admins, Pod Leaders and Hub hosts.
            It is waiting for them when they claim their place, and they
            never see a checkout.
          </small>
        </span>
      </label>

      <label className="field">
        <span>Why</span>
        <input name="complimentary_reason" placeholder="Local Admin, Dubai" />
        <span className="hint">
          Kept with each record, and copied onto their profile. Only used
          when the box above is ticked.
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add them to the list"}
      </button>
    </form>
  );
}

// One person, after the fact. The admin pastes a list and then
// remembers that one of them is a Pod Leader.
export function ComplimentaryToggle({
  id,
  on,
}: {
  id: string;
  on: boolean;
}) {
  const [, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    setComplimentary,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="on" value={on ? "" : "yes"} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving" : on ? "Make them pay" : "Make it complimentary"}
      </button>
    </form>
  );
}

export function RemindButton({ id }: { id: string }) {
  const [, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    remind,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving" : "Mark reminded"}
      </button>
    </form>
  );
}

export function DeadlineForm({
  villageId,
  deadline,
}: {
  villageId: string;
  deadline: string | null;
}) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    setDeadline,
    {}
  );

  return (
    <form action={action} className="row" style={{ flexWrap: "wrap" }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <input type="date" name="deadline" defaultValue={deadline ?? ""} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Set the deadline"}
      </button>
    </form>
  );
}

export function CloseOutButton({ villageId }: { villageId: string }) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    closeOut,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving" : "Create removal tasks"}
      </button>
    </form>
  );
}