"use client";

import { useActionState } from "react";
import { createPost, replyToPost, closePost, type PostState } from "./actions";

export function PostForm({ villageName }: { villageName: string | null }) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    createPost,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>Are you asking or offering?</span>
        <select name="kind" defaultValue="ask">
          <option value="ask">Asking for help</option>
          <option value="offer">Offering something</option>
        </select>
      </label>

      <label className="field">
        <span>Who should see it?</span>
        <select name="reach" defaultValue="village">
          <option value="village">
            {villageName ? `${villageName} Village only` : "My Village only"}
          </option>
          <option value="all_villages">Every Village</option>
        </select>
        <span className="hint">
          Members in other Villages can read either way. Replying across
          Villages is part of the paid plan.
        </span>
      </label>

      <label className="field">
        <span>What is it about?</span>
        <input
          name="category"
          placeholder="Licensing, hiring, suppliers, banking, anything"
        />
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" required placeholder="One line that says it" />
      </label>

      <label className="field">
        <span>The detail</span>
        <textarea
          name="body"
          rows={5}
          required
          placeholder="What you have tried, and what a good answer looks like"
        />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post"}
      </button>
    </form>
  );
}

export function ReplyForm({ askId }: { askId: string }) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    replyToPost,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="ask_id" value={askId} />
      <label className="field">
        <span>Your reply</span>
        <textarea name="body" rows={3} required />
      </label>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Reply"}
      </button>
    </form>
  );
}

export function CloseForm({ askId }: { askId: string }) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    closePost,
    {}
  );

  return (
    <form action={action} className="panel wash">
      <h3>Did this get sorted?</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="ask_id" value={askId} />
      <label className="field">
        <span>What happened, in a line</span>
        <input name="outcome" placeholder="Who helped, and how it turned out" />
        <span className="hint">
          Closed posts show the Village that asking here works.
        </span>
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving" : "Mark as sorted"}
      </button>
    </form>
  );
}