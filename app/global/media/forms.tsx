"use client";

import { useActionState } from "react";
import { saveArticle, handleStorySuggestion, type ArticleState } from "./actions";
import { Uploader } from "@/components/uploader";

type Option = { id: string; name: string };

export function ArticleForm({
  villages,
  article,
}: {
  villages: Option[];
  article?: {
    id: string;
    kind: string;
    title: string;
    standfirst: string | null;
    body: string;
    cover_url: string | null;
    about_id: string | null;
    village_id: string | null;
    member_only: boolean;
    status: string;
    published_at: string | null;
  };
}) {
  const [state, action, pending] = useActionState<ArticleState, FormData>(
    saveArticle,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{article ? article.title : "A new piece"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {article ? <input type="hidden" name="id" value={article.id} /> : null}
      {article?.published_at ? (
        <input type="hidden" name="published_at" value={article.published_at} />
      ) : null}

      <div className="g2">
        <label className="field">
          <span>What is it</span>
          <select name="kind" defaultValue={article?.kind ?? "story"}>
            <option value="story">A member story</option>
            <option value="guide">A guide</option>
            <option value="note">A note</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={article?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Title</span>
        <input name="title" required defaultValue={article?.title ?? ""} />
      </label>

      <label className="field">
        <span>The line under the title</span>
        <input name="standfirst" defaultValue={article?.standfirst ?? ""} />
      </label>

      <Uploader
        name="cover_url"
        folder="media"
        label="Cover image"
        hint="A photograph of the person beats a graphic."
        current={article?.cover_url}
      />

      <div className="g2">
        <label className="field">
          <span>Who it is about</span>
          <input
            name="about_id"
            defaultValue={article?.about_id ?? ""}
            placeholder="A member id, or leave it empty"
          />
          <span className="hint">
            Ask them before you write about them. The piece links to their
            profile.
          </span>
        </label>
        <label className="field">
          <span>Village</span>
          <select name="village_id" defaultValue={article?.village_id ?? ""}>
            <option value="">No particular Village</option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>The piece</span>
        <textarea name="body" rows={14} required defaultValue={article?.body ?? ""} />
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="member_only"
          defaultChecked={article?.member_only ?? false}
        />
        <span>
          <b>Members only</b>
          <small>
            Off means anybody can read it, which is how it brings people in.
          </small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function SuggestionDecision({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ArticleState, FormData>(
    handleStorySuggestion,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="suggestion_id" value={id} />
      <div className="row">
        <select name="status" defaultValue="read">
          <option value="read">Read</option>
          <option value="discussing">Talking about it</option>
          <option value="actioned">Writing it</option>
          <option value="not_now">Not now</option>
        </select>
        <button className="btn btn-ghost" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save"}
        </button>
      </div>
    </form>
  );
}