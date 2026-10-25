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
      {state.error ? <div className="flag hold">{state.error}</div> : null}

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
          Villages is part of Village Membership.
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

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post"}
      </button>
    </form>
  );
}

export function ReplyForm({
  askId,
  people = [],
}: {
  askId: string;
  // Members this reply can point at. Empty and the picker is left out.
  people?: { id: string; full_name: string; headline?: string | null }[];
}) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    replyToPost,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="ask_id" value={askId} />
      <label className="field">
        <span>Your reply</span>
        <textarea name="body" rows={3} required />
      </label>

      {people.length ? (
        <label className="field">
          <span>Put them in touch with somebody</span>
          <select name="mentions" multiple size={5}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
                {p.headline ? `, ${p.headline}` : ""}
              </option>
            ))}
          </select>
          <span className="hint">
            Up to three. Everybody you choose is told, and their names
            appear under your reply.
          </span>
        </label>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Reply"}
      </button>
    </form>
  );
}

// The post a new member finds already written for them, out of the two
// answers they gave when they asked to join. They edit it and post it.
export function IntroduceForm({
  lookingFor,
  canHelpWith,
  name,
}: {
  lookingFor: string;
  canHelpWith: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    createPost,
    {}
  );

  const body = [
    canHelpWith ? `What I can help with: ${canHelpWith}` : "",
    lookingFor ? `What I am looking for: ${lookingFor}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="kind" value="introduction" />

      <label className="field">
        <span>Your introduction</span>
        <input name="title" required defaultValue={`${name} has joined`} />
      </label>

      <label className="field">
        <span>In your own words</span>
        <textarea name="body" rows={6} required defaultValue={body} />
        <span className="hint">
          Written from what you told us when you asked to join. Change
          anything you like before it goes up.
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post your introduction"}
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
    <form action={action} className="panel panel-wash">
      <h3>Did this get sorted?</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="ask_id" value={askId} />
      <label className="field">
        <span>What happened, in a line</span>
        <input name="outcome" placeholder="Who helped, and how it turned out" />
        <span className="hint">
          Closed posts show the Village that asking here works.
        </span>
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Mark as sorted"}
      </button>
    </form>
  );
}