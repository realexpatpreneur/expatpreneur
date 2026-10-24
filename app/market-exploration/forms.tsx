"use client";

import { useActionState } from "react";
import {
  createMarketPost,
  replyToMarketPost,
  closeMarketPost,
  type MarketState,
} from "./actions";
import { Combo } from "@/components/combo";
import { CITIES } from "@/lib/lists/cities";
import { COUNTRIES } from "@/lib/lists/countries";

const stages = [
  ["exploring", "Just exploring"],
  ["have_plan", "Have a plan"],
  ["ready", "Ready to move"],
  ["selling", "Already selling there"],
];

export function MarketPostForm() {
  const [state, action, pending] = useActionState<MarketState, FormData>(
    createMarketPost,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>What are you looking for?</span>
        <input
          name="title"
          required
          placeholder="A distributor, a first client, someone who has done it"
        />
      </label>

      <label className="field">
        <span>Industry</span>
        <input name="industry" required placeholder="Beauty, hospitality, software" />
      </label>

      <Combo
        name="country"
        label="Country"
        options={COUNTRIES}
        placeholder="Where you are looking"
        required
      />

      <Combo
        name="city"
        label="City"
        options={CITIES}
        allowNew
        hint="Leave it out if the whole country is fine."
      />

      <label className="field">
        <span>How far along are you?</span>
        <select name="stage" defaultValue="exploring">
          {stages.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Tell them more</span>
        <textarea
          name="body"
          rows={5}
          required
          placeholder="What you sell, what you have tried, and what a good introduction looks like"
        />
      </label>

      <p className="muted small">
        This goes to every Village, so the people who know that market can see
        it.
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post"}
      </button>
    </form>
  );
}

export function MarketReplyForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<MarketState, FormData>(
    replyToMarketPost,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="post_id" value={postId} />
      <label className="field">
        <span>Your reply</span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Who you know there, or what you learned doing it yourself"
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Reply"}
      </button>
    </form>
  );
}


export function CloseMarketForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<MarketState, FormData>(
    closeMarketPost,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="post_id" value={postId} />
      <label className="field">
        <span>What came of it?</span>
        <input name="outcome" placeholder="Who you met, or what you decided" />
        <span className="hint">
          Worth a line. The next person looking at that market reads it.
        </span>
      </label>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Closing" : "Close this"}
      </button>
    </form>
  );
}