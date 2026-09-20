"use client";

import { useActionState } from "react";
import { saveSession, addSessionHost, type SessionFormState } from "./actions";

type Option = { value: string; label: string };

export function SessionForm({
  audiences,
  events,
}: {
  audiences: Option[];
  events: Option[];
}) {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(
    saveSession,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <div className="panel" style={{ maxWidth: 820 }}>
        <h3>The session</h3>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Title</span>
          <input name="title" required placeholder="Founders roundtable, live" />
        </label>
        <label className="field">
          <span>What it is for</span>
          <textarea name="purpose" rows={3} />
        </label>
        <div className="two">
          <label className="field">
            <span>Date</span>
            <input name="date" type="date" required />
          </label>
          <label className="field">
            <span>Start</span>
            <input name="time" type="time" required />
          </label>
        </div>
        <div className="two">
          <label className="field">
            <span>End</span>
            <input name="end_time" type="time" />
          </label>
          <label className="field">
            <span>Time zone</span>
            <select name="timezone" defaultValue="Asia/Dubai">
              <option value="Asia/Dubai">Dubai</option>
              <option value="Europe/Lisbon">Lisbon</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Madrid">Madrid</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        {events.length ? (
          <label className="field">
            <span>Part of an event</span>
            <select name="event_id" defaultValue="">
              <option value="">On its own</option>
              {events.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
        <h3>Who can come in</h3>
        <label className="check" style={{ marginTop: 12 }}>
          <input type="radio" name="visibility" value="private" defaultChecked />
          <span>
            <b>Members only</b>
            <small>Choose which members below.</small>
          </span>
        </label>
        <label className="check">
          <input type="radio" name="visibility" value="public" />
          <span>
            <b>Public</b>
            <small>Anyone with the link, member or not.</small>
          </span>
        </label>

        <div className="two">
          <label className="field">
            <span>Which members</span>
            <select name="audience" defaultValue={audiences[0]?.value}>
              {audiences.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Membership</span>
            <select name="tier" defaultValue="all">
              <option value="all">All members</option>
              <option value="paid">Paid members only</option>
            </select>
          </label>
        </div>

        <label className="check">
          <input type="checkbox" name="allow_guests" />
          <span>
            <b>Let people without an account in</b>
            <small>Only applies when the session is public.</small>
          </span>
        </label>
      </div>

      <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
        <h3>How the room runs</h3>
        <label className="check" style={{ marginTop: 12 }}>
          <input type="checkbox" name="lobby" defaultChecked />
          <span>
            <b>Use a lobby</b>
            <small>A host lets people in one by one.</small>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="chat" defaultChecked />
          <span>
            <b>Chat</b>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="hand_raise" defaultChecked />
          <span>
            <b>Hands and questions</b>
          </span>
        </label>
        <div className="two">
          <label className="field">
            <span>Room size</span>
            <input name="max_participants" type="number" min={2} defaultValue={100} />
          </label>
          <label className="field">
            <span>Recording</span>
            <select name="recording" defaultValue="off">
              <option value="off">Do not record</option>
              <option value="on_request">Record if the host starts it</option>
              <option value="always">Record from the start</option>
            </select>
            <span className="hint">
              Everyone in the room is told when recording starts.
            </span>
          </label>
        </div>
      </div>

      <p style={{ marginTop: 16 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Saving" : "Schedule the session"}
        </button>
      </p>
    </form>
  );
}

export function AddHostForm({
  sessionId,
  people,
}: {
  sessionId: string;
  people: { id: string; full_name: string }[];
}) {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(
    addSessionHost,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <select name="profile_id" defaultValue={people[0]?.id}>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name}
          </option>
        ))}
      </select>
      <select name="role" defaultValue="cohost">
        <option value="cohost">Co-host</option>
        <option value="host">Host</option>
        <option value="presenter">Presenter</option>
      </select>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add"}
      </button>
    </form>
  );
}