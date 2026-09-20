"use client";

import { useActionState } from "react";
import { joinGroup, leaveGroup, joinPod, leavePod, type JoinState } from "./actions";

export function JoinGroupButton({
  groupId,
  slug,
  joined,
}: {
  groupId: string;
  slug: string;
  joined: boolean;
}) {
  const [state, action, pending] = useActionState<JoinState, FormData>(
    joined ? leaveGroup : joinGroup,
    {}
  );

  if (state.done === "joined") {
    return (
      <div className="flag ok">
        You are in. The lead will share the WhatsApp group.
      </div>
    );
  }
  if (state.done === "left") {
    return <div className="flag hold">You have left the Group.</div>;
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="slug" value={slug} />
      <button className={`btn ${joined ? "" : "btn-primary"}`} type="submit" disabled={pending}>
        {pending ? "Saving" : joined ? "Leave the Group" : "Join the Group"}
      </button>
    </form>
  );
}

export function JoinPodButton({
  podId,
  slug,
  joined,
  full,
}: {
  podId: string;
  slug: string;
  joined: boolean;
  full: boolean;
}) {
  const [state, action, pending] = useActionState<JoinState, FormData>(
    joined ? leavePod : joinPod,
    {}
  );

  if (state.done === "joined") {
    return (
      <div className="flag ok">
        You are in. The lead will be in touch about the first meeting.
      </div>
    );
  }
  if (state.done === "left") {
    return <div className="flag hold">You have left the Pod.</div>;
  }

  if (!joined && full) {
    return (
      <div className="panel panel-wash">
        <h3>This Pod is full</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Pods stay small on purpose. Tell your Local Admin and the next one
          forms sooner.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="pod_id" value={podId} />
      <input type="hidden" name="slug" value={slug} />
      <button className={`btn ${joined ? "" : "btn-primary"}`} type="submit" disabled={pending}>
        {pending ? "Saving" : joined ? "Leave the Pod" : "Join the Pod"}
      </button>
    </form>
  );
}