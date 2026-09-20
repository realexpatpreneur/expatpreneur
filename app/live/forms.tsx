"use client";

import { useActionState } from "react";
import {
  knockOnDoor,
  leaveRoom,
  decideOnParticipant,
  setParticipantRole,
  setSessionStatus,
  type LiveState,
} from "./actions";

export function KnockButton({
  sessionId,
  slug,
  lobby,
  label,
}: {
  sessionId: string;
  slug: string;
  lobby: boolean;
  label: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    knockOnDoor,
    {}
  );

  if (state.done === "waiting") {
    return (
      <div className="notice good">
        You are at the door. A host will let you in.
      </div>
    );
  }
  if (state.done === "admitted") {
    return <div className="notice good">You are in the room.</div>;
  }

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lobby" value={lobby ? "1" : "0"} />
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Knocking" : label}
      </button>
    </form>
  );
}

export function LeaveButton({
  sessionId,
  slug,
}: {
  sessionId: string;
  slug: string;
}) {
  const [, action, pending] = useActionState<LiveState, FormData>(leaveRoom, {});

  return (
    <form action={action}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Leaving" : "Leave the room"}
      </button>
    </form>
  );
}

export function DoorDecision({
  participantId,
  slug,
  state: current,
}: {
  participantId: string;
  slug: string;
  state: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    decideOnParticipant,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="slug" value={slug} />
      {current === "waiting" ? (
        <button className="btn primary" name="decision" value="admit" disabled={pending}>
          Let them in
        </button>
      ) : null}
      <button className="btn" name="decision" value="remove" disabled={pending}>
        Remove
      </button>
    </form>
  );
}

export function RoleSelect({
  participantId,
  slug,
  role,
}: {
  participantId: string;
  slug: string;
  role: string;
}) {
  const [, action, pending] = useActionState<LiveState, FormData>(
    setParticipantRole,
    {}
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="slug" value={slug} />
      <select name="role" defaultValue={role}>
        <option value="participant">In the room</option>
        <option value="presenter">Presenter</option>
        <option value="cohost">Co-host</option>
        <option value="observer">Watching</option>
      </select>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Set"}
      </button>
    </form>
  );
}

export function SessionControls({
  sessionId,
  slug,
  status,
}: {
  sessionId: string;
  slug: string;
  status: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    setSessionStatus,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      {status !== "live" ? (
        <button className="btn primary" name="status" value="live" disabled={pending}>
          Open the room
        </button>
      ) : (
        <button className="btn" name="status" value="ended" disabled={pending}>
          End the session
        </button>
      )}
    </form>
  );
}