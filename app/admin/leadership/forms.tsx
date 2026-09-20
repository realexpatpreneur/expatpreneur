"use client";

import { useActionState } from "react";
import { suggestLeader, type LeadershipState } from "./actions";

export function SuggestLeaderForm({
  members,
}: {
  members: { id: string; full_name: string }[];
}) {
  const [state, action, pending] = useActionState<LeadershipState, FormData>(
    suggestLeader,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Put somebody forward</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? (
        <div className="flag ok">
          Sent to the Global team. The member is not told unless it goes
          ahead.
        </div>
      ) : null}

      <label className="field">
        <span>Member</span>
        <select name="profile_id" defaultValue={members[0]?.id}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Could become</span>
        <select name="role" defaultValue="circle_host">
          <option value="circle_host">Circle Host</option>
          <option value="industry_lead">Industry Lead</option>
          <option value="pod_lead">Pod Lead</option>
          <option value="educator">Educator</option>
          <option value="local_admin">Local Admin</option>
        </select>
      </label>

      <label className="field">
        <span>Why</span>
        <textarea
          name="why"
          rows={3}
          placeholder="What you have seen them do, not what you hope they would do"
        />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Suggest to Global"}
      </button>
    </form>
  );
}