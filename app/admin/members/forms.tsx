"use client";

import { useActionState } from "react";
import {
  updateMember,
  saveCircle,
  completeWhatsappTask,
  sendAnnouncement,
  type MemberAdminState,
} from "./actions";

export function MemberForm({
  id,
  circles,
  circleId,
  status,
  plan,
}: {
  id: string;
  circles: { id: string; name: string; places_left: number }[];
  circleId: string | null;
  status: string;
  plan: string;
}) {
  const [state, action, pending] = useActionState<MemberAdminState, FormData>(
    updateMember,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Membership</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />

      <label className="field" style={{ marginTop: 10 }}>
        <span>Circle</span>
        <select name="circle_id" defaultValue={circleId ?? ""}>
          <option value="">Not placed yet</option>
          {circles.map((circle) => (
            <option key={circle.id} value={circle.id}>
              {circle.name}, {circle.places_left} places left
            </option>
          ))}
        </select>
        <span className="hint">
          Moving someone adds a WhatsApp task, so the groups stay in step.
        </span>
      </label>

      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={status}>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="quiet">Quiet</option>
          <option value="left">Left</option>
          <option value="removed">Removed</option>
        </select>
      </label>

      <label className="field">
        <span>Plan</span>
        <select name="plan" defaultValue={plan}>
          <option value="member">Member</option>
          <option value="paid">Paid member</option>
        </select>
        <span className="hint">
          Set by hand until payments are live, then Stripe keeps it right.
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function CircleForm({
  villages,
  circle,
}: {
  villages: { id: string; name: string }[];
  circle?: {
    id: string;
    name: string;
    whatsapp_url: string | null;
    status: string;
    village_id: string;
  };
}) {
  const [state, action, pending] = useActionState<MemberAdminState, FormData>(
    saveCircle,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{circle ? `Edit ${circle.name}` : "New Circle"}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {circle ? <input type="hidden" name="id" value={circle.id} /> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Name</span>
        <input name="name" required defaultValue={circle?.name ?? ""} />
      </label>

      {circle ? null : (
        <label className="field">
          <span>Village</span>
          <select name="village_id" defaultValue={villages[0]?.id}>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>WhatsApp group link</span>
        <input
          name="whatsapp_url"
          defaultValue={circle?.whatsapp_url ?? ""}
          placeholder="https://chat.whatsapp.com/..."
        />
        <span className="hint">
          New members see this on the page they land on after joining.
        </span>
      </label>

      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={circle?.status ?? "preparing"}>
          <option value="preparing">Preparing</option>
          <option value="welcoming">Welcoming</option>
          <option value="full">Full</option>
          <option value="closed">Closed</option>
        </select>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function TaskDone({ taskId }: { taskId: string }) {
  const [, action, pending] = useActionState<MemberAdminState, FormData>(
    completeWhatsappTask,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="task_id" value={taskId} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Done"}
      </button>
    </form>
  );
}

export function AnnouncementForm({ villageName }: { villageName: string | null }) {
  const [state, action, pending] = useActionState<MemberAdminState, FormData>(
    sendAnnouncement,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Who is it for?</span>
        <select name="audience" defaultValue="village">
          <option value="village">
            {villageName ? `${villageName} Village` : "My Village"}
          </option>
          <option value="circle">One Circle</option>
        </select>
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" required />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea name="body" rows={5} required />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send"}
      </button>
    </form>
  );
}