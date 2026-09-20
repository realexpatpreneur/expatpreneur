"use client";

import { useActionState } from "react";
import {
  knockOnDoor,
  leaveRoom,
  decideOnParticipant,
  setParticipantRole,
  setSessionStatus,
  beginRecording,
  endRecording,
  beginStreaming,
  endStreaming,
  addStreamTarget,
  publishRecording,
  createBreakouts,
  shuffleBreakouts,
  setBreakoutsOpen,
  askQuestion,
  answerQuestion,
  cancelSession,
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

export function CancelSessionButton({
  sessionId,
  slug,
}: {
  sessionId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<LiveState, FormData>(
    cancelSession,
    {}
  );

  return (
    <form action={action} style={{ marginTop: 10 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Calling it off" : "Call it off"}
      </button>
    </form>
  );
}

export function RecordingControls({
  sessionId,
  slug,
  recording,
}: {
  sessionId: string;
  slug: string;
  recording: { id: string; status: string; url: string | null; media_item_id: string | null } | null;
}) {
  const [startState, startAction, starting] = useActionState<LiveState, FormData>(
    beginRecording,
    {}
  );
  const [stopState, stopAction, stopping] = useActionState<LiveState, FormData>(
    endRecording,
    {}
  );
  const [publishState, publishAction, publishing] = useActionState<LiveState, FormData>(
    publishRecording,
    {}
  );

  const running = recording?.status === "recording";

  return (
    <div>
      {startState.error ? <div className="notice bad">{startState.error}</div> : null}
      {stopState.error ? <div className="notice bad">{stopState.error}</div> : null}
      {publishState.error ? (
        <div className="notice bad">{publishState.error}</div>
      ) : null}
      {publishState.done === "published" ? (
        <div className="notice good">
          It is in Watch and Listen, for members only.
        </div>
      ) : null}

      {running ? (
        <form action={stopAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn" type="submit" disabled={stopping}>
            {stopping ? "Stopping" : "Stop recording"}
          </button>
        </form>
      ) : (
        <form action={startAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn primary" type="submit" disabled={starting}>
            {starting ? "Starting" : "Start recording"}
          </button>
        </form>
      )}

      {recording && recording.status === "processing" ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          Being processed. It appears here when it is ready.
        </p>
      ) : null}

      {recording?.status === "ready" && recording.url ? (
        <div style={{ marginTop: 12 }}>
          <a
            className="btn"
            href={`/api/live/recording/${recording.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Watch it back
          </a>
          {recording.media_item_id ? null : (
            <form action={publishAction} style={{ marginTop: 8 }}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="recording_id" value={recording.id} />
              <button className="btn" type="submit" disabled={publishing}>
                {publishing ? "Publishing" : "Put it in Watch and Listen"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function StreamingControls({
  sessionId,
  slug,
  targets,
}: {
  sessionId: string;
  slug: string;
  targets: { id: string; platform: string; status: string }[];
}) {
  const [addState, addAction, adding] = useActionState<LiveState, FormData>(
    addStreamTarget,
    {}
  );
  const [startState, startAction, starting] = useActionState<LiveState, FormData>(
    beginStreaming,
    {}
  );
  const [stopState, stopAction, stopping] = useActionState<LiveState, FormData>(
    endStreaming,
    {}
  );

  const live = targets.some((t) => t.status === "live");

  return (
    <div>
      {addState.error ? <div className="notice bad">{addState.error}</div> : null}
      {startState.error ? <div className="notice bad">{startState.error}</div> : null}
      {stopState.error ? <div className="notice bad">{stopState.error}</div> : null}

      {targets.length ? (
        <div className="rows" style={{ marginBottom: 12 }}>
          {targets.map((target) => (
            <div className="rowlink" key={target.id}>
              <div>
                <b>{target.platform}</b>
              </div>
              <div className="rowmeta">
                <span className={`chip ${target.status === "live" ? "mint" : ""}`}>
                  {target.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {live ? (
        <form action={stopAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn" type="submit" disabled={stopping}>
            {stopping ? "Stopping" : "Stop streaming"}
          </button>
        </form>
      ) : (
        <>
          <form action={addAction}>
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="slug" value={slug} />
            <label className="field">
              <span>Where to</span>
              <select name="platform" defaultValue="youtube">
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="custom">Somewhere else</option>
              </select>
            </label>
            <label className="field">
              <span>RTMP address</span>
              <input name="rtmp_url" placeholder="rtmp://a.rtmp.youtube.com/live2" />
            </label>
            <label className="field">
              <span>Stream key</span>
              <input name="stream_key" />
              <span className="hint">
                Only hosts of this session can see these.
              </span>
            </label>
            <button className="btn" type="submit" disabled={adding}>
              {adding ? "Saving" : "Add destination"}
            </button>
          </form>

          {targets.length ? (
            <form action={startAction} style={{ marginTop: 12 }}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="slug" value={slug} />
              <button className="btn primary" type="submit" disabled={starting}>
                {starting ? "Starting" : "Go live to them"}
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}

export function BreakoutPanel({
  sessionId,
  slug,
  rooms,
}: {
  sessionId: string;
  slug: string;
  rooms: { id: string; name: string; topic: string | null; open: boolean; seats: number }[];
}) {
  const [makeState, makeAction, making] = useActionState<LiveState, FormData>(
    createBreakouts,
    {}
  );
  const [shuffleState, shuffleAction, shuffling] = useActionState<LiveState, FormData>(
    shuffleBreakouts,
    {}
  );
  const [openState, openAction, opening] = useActionState<LiveState, FormData>(
    setBreakoutsOpen,
    {}
  );

  const open = rooms.some((room) => room.open);

  return (
    <div>
      {makeState.error ? <div className="notice bad">{makeState.error}</div> : null}
      {shuffleState.error ? (
        <div className="notice bad">{shuffleState.error}</div>
      ) : null}
      {openState.error ? <div className="notice bad">{openState.error}</div> : null}

      {rooms.length ? (
        <div className="rows" style={{ marginBottom: 12 }}>
          {rooms.map((room) => (
            <div className="rowlink" key={room.id}>
              <div>
                <b>{room.name}</b>
                <div className="muted small">
                  {room.seats} {room.seats === 1 ? "person" : "people"}
                  {room.topic ? `. ${room.topic}` : ""}
                </div>
              </div>
              <div className="rowmeta">
                {room.open ? <span className="chip mint">Open</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small" style={{ marginTop: 6 }}>
          No tables yet.
        </p>
      )}

      {open ? (
        <form action={openAction}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="open" value="0" />
          <button className="btn" type="submit" disabled={opening}>
            {opening ? "Closing" : "Call everyone back"}
          </button>
        </form>
      ) : (
        <div className="row">
          <form action={makeAction} className="row">
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="slug" value={slug} />
            <input
              name="rooms"
              type="number"
              min={2}
              max={12}
              defaultValue={3}
              style={{ width: 70 }}
            />
            <button className="btn" type="submit" disabled={making}>
              {making ? "Making" : "Make tables"}
            </button>
          </form>

          {rooms.length ? (
            <>
              <form action={shuffleAction}>
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="slug" value={slug} />
                <button className="btn" type="submit" disabled={shuffling}>
                  {shuffling ? "Dealing" : "Deal everyone out"}
                </button>
              </form>
              <form action={openAction}>
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="open" value="1" />
                <button className="btn primary" type="submit" disabled={opening}>
                  {opening ? "Opening" : "Send them to the tables"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      )}

      {open ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          People rejoin the room to land at their table. Calling them back
          does the same in reverse.
        </p>
      ) : null}
    </div>
  );
}

export function QuestionsPanel({
  sessionId,
  slug,
  isHost,
  questions,
}: {
  sessionId: string;
  slug: string;
  isHost: boolean;
  questions: {
    id: string;
    body: string;
    answered_at: string | null;
    asker: string;
  }[];
}) {
  const [askState, askAction, asking] = useActionState<LiveState, FormData>(
    askQuestion,
    {}
  );
  const [, answerAction, answering] = useActionState<LiveState, FormData>(
    answerQuestion,
    {}
  );

  const waiting = questions.filter((q) => !q.answered_at);
  const done = questions.filter((q) => q.answered_at);

  return (
    <div>
      {askState.error ? <div className="notice bad">{askState.error}</div> : null}
      {askState.done === "asked" ? (
        <div className="notice good">Asked. The host sees it.</div>
      ) : null}

      {waiting.length ? (
        <div className="rows" style={{ margin: "12px 0" }}>
          {waiting.map((question) => (
            <div className="rowlink" key={question.id}>
              <div>
                <b>{question.body}</b>
                <div className="muted small">{question.asker}</div>
              </div>
              {isHost ? (
                <div className="rowmeta">
                  <form action={answerAction}>
                    <input type="hidden" name="session_id" value={sessionId} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="question_id" value={question.id} />
                    <button className="btn" type="submit" disabled={answering}>
                      Answered
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small" style={{ marginTop: 6 }}>
          Nothing asked yet.
        </p>
      )}

      <form action={askAction} style={{ marginTop: 12 }}>
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="slug" value={slug} />
        <label className="field">
          <span>Ask something</span>
          <input name="body" placeholder="Put it plainly" />
        </label>
        <button className="btn" type="submit" disabled={asking}>
          {asking ? "Asking" : "Ask"}
        </button>
      </form>

      {isHost && done.length ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          {done.length} answered already.
        </p>
      ) : null}
    </div>
  );
}