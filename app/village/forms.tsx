"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Av } from "@/components/bits";
import { createPost, replyToPost, closePost, type PostState } from "./actions";

const TOPICS = ["Suppliers", "Hiring", "Licensing", "Banking", "Expertise", "Introductions"];

// The posting form, with the post drawn beside it as it will appear in
// the feed while it is being written.
export function PostForm({
  villageName,
  name = "You",
  avatar = null,
  headline = null,
  initialKind = "ask",
}: {
  villageName: string | null;
  name?: string;
  avatar?: string | null;
  headline?: string | null;
  initialKind?: "ask" | "offer";
}) {
  const [state, action, pending] = useActionState<PostState, FormData>(
    createPost,
    {}
  );
  const [kind, setKind] = useState<"ask" | "offer">(initialKind);
  const [reach, setReach] = useState<"village" | "all_villages">("village");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");

  const ask = kind === "ask";
  const here = villageName ? `${villageName} Village` : "Your Village";
  const ready = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="m-postgrid">
      <form action={action}>
        {state.error ? <div className="m-flag">{state.error}</div> : null}
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="reach" value={reach} />

        <div className="m-two" role="radiogroup" aria-label="Are you asking or offering?">
          <button type="button" role="radio" aria-checked={ask} className="m-choice" onClick={() => setKind("ask")}>
            <span className="m-radio" />
            <span>
              <b>Ask</b>
              <span className="d">You need a supplier, an introduction or an answer.</span>
            </span>
          </button>
          <button type="button" role="radio" aria-checked={!ask} className="m-choice" onClick={() => setKind("offer")}>
            <span className="m-radio" />
            <span>
              <b>Offer</b>
              <span className="d">You have time, a resource, a space or know how to share.</span>
            </span>
          </button>
        </div>

        <div className="m-fld">
          <label className="m-lab" htmlFor="post-title">
            Title<small>One line that says it</small>
          </label>
          <input
            id="post-title"
            className="m-inp"
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={ask ? "Looking for a customs broker who knows food imports" : "A free hour on pricing for anyone launching a service"}
          />
          <div className="m-count">
            <span>Members see this first</span>
            <span>{title.length} / 120</span>
          </div>
        </div>

        <div className="m-fld">
          <label className="m-lab" htmlFor="post-body">
            The detail
          </label>
          <textarea
            id="post-body"
            className="m-inp"
            name="body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={ask ? "What you have tried, by when, and what a good answer looks like" : "What you are offering, to whom, and how to take you up on it"}
          />
        </div>

        <div className="m-fld">
          <span className="m-lab">What is it about?</span>
          <div className="m-cats">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                className="m-cat"
                aria-pressed={topic === t}
                onClick={() => setTopic(topic === t ? "" : t)}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            className="m-inp"
            name="category"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Or name it yourself"
            aria-label="Topic"
          />
        </div>

        <div className="m-fld">
          <span className="m-lab">Who should see it?</span>
          <div className="m-two" role="radiogroup" aria-label="Who should see it?">
            <button type="button" role="radio" aria-checked={reach === "village"} className="m-choice" onClick={() => setReach("village")}>
              <span className="m-radio" />
              <span>
                <b style={{ fontSize: 15 }}>{villageName ? `${villageName} Village only` : "My Village only"}</b>
                <span className="d">The people you see at events</span>
              </span>
            </button>
            <button type="button" role="radio" aria-checked={reach === "all_villages"} className="m-choice" onClick={() => setReach("all_villages")}>
              <span className="m-radio" />
              <span>
                <b style={{ fontSize: 15 }}>Every Village</b>
                <span className="d">Best for markets you are entering</span>
              </span>
            </button>
          </div>
          <p className="m-hint">
            Members in other Villages can read either way. Replying across
            Villages is part of Village Membership.
          </p>
        </div>

        <div className="m-foot">
          <button className="btn btn-primary" type="submit" disabled={pending || !ready} style={{ height: 44, padding: "0 20px", fontSize: 14, opacity: ready ? 1 : 0.45 }}>
            {pending ? "Posting" : ask ? "Post your Ask" : "Post your Offer"}
          </button>
          <Link className="btn btn-ghost" href="/my-village" style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
            Cancel
          </Link>
          <span className="m-muted" style={{ fontSize: 13, marginLeft: "auto" }}>
            No pitching. You can mark it sorted later.
          </span>
        </div>
      </form>

      <aside className="m-preview">
        <span className="m-kind m-muted">How it will look in the feed</span>
        <div className="m-pv" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 14 }}>
            <Av name={name} src={avatar} className="av-lg" />
            <div style={{ minWidth: 0 }}>
              <div className="m-meta">
                <b>{name}</b>
                {headline ? <span className="m-muted">{headline}</span> : null}
                <span className="m-muted">just now</span>
              </div>
              <span className={`m-kind ${ask ? "m-ask" : "m-offer"}`} style={{ display: "inline-block", marginTop: 6 }}>
                {ask ? "Ask" : "Offer"}
                {topic.trim() ? <span className="m-muted" style={{ letterSpacing: ".06em" }}>, {topic.trim()}</span> : null}
              </span>
              <h3 className={title.trim() ? "" : "m-ghost"}>
                {title.trim() || (ask ? "Your Ask appears here" : "Your Offer appears here")}
              </h3>
              {body.trim() ? <p>{body}</p> : null}
              <div className="m-muted" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E3E6EA", fontSize: 13 }}>
                {reach === "village" ? `Seen by ${here}` : "Seen in every Village"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <b style={{ fontSize: 15 }}>Posts that get answered</b>
          <div className="m-steps">
            <div>
              <span>1</span>
              <span>
                <b style={{ color: "#0F1419" }}>Name the thing.</b> A photographer
                who has shot hotel rooms beats any creatives.
              </span>
            </div>
            <div>
              <span>2</span>
              <span>
                <b style={{ color: "#0F1419" }}>Give a date.</b> People reply
                faster when they know it is this week.
              </span>
            </div>
            <div>
              <span>3</span>
              <span>
                <b style={{ color: "#0F1419" }}>Close the loop.</b> Mark it sorted
                and say who helped. It is how trust builds here.
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
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