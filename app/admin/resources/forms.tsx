"use client";

import { useActionState } from "react";
import { saveResource, saveMedia, type LibraryState } from "./actions";

export function ResourceForm({
  resource,
}: {
  resource?: {
    id: string;
    title: string;
    kind: string;
    description: string | null;
    url: string | null;
    all_villages: boolean;
  };
}) {
  const [state, action, pending] = useActionState<LibraryState, FormData>(
    saveResource,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{resource ? "Edit" : "Add a resource"}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Title</span>
        <input name="title" required defaultValue={resource?.title ?? ""} />
      </label>

      <label className="field">
        <span>Kind</span>
        <select name="kind" defaultValue={resource?.kind ?? "guide"}>
          <option value="guide">Guide</option>
          <option value="template">Template</option>
          <option value="recording">Recording</option>
        </select>
      </label>

      <label className="field">
        <span>What is it for?</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={resource?.description ?? ""}
        />
      </label>

      <label className="field">
        <span>Link</span>
        <input name="url" defaultValue={resource?.url ?? ""} placeholder="https://" />
        <span className="hint">
          A document, a recording, anything members can open.
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="all_villages"
          defaultChecked={resource?.all_villages ?? false}
        />
        <span>
          <b>Useful in every Village</b>
          <small>
            Leave it off for things that only make sense in your own city.
          </small>
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function MediaForm({
  item,
}: {
  item?: {
    id: string;
    title: string;
    kind: string;
    summary: string | null;
    body: string | null;
    external_url: string | null;
    duration: string | null;
    member_only: boolean;
    show_slug?: string | null;
    episode_number?: number | null;
    published_at: string | null;
  };
}) {
  const [state, action, pending] = useActionState<LibraryState, FormData>(
    saveMedia,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{item ? "Edit" : "Add to Watch and Listen"}</h3>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <label className="field" style={{ marginTop: 10 }}>
        <span>Title</span>
        <input name="title" required defaultValue={item?.title ?? ""} />
      </label>

      <label className="field">
        <span>Kind</span>
        <select name="kind" defaultValue={item?.kind ?? "video"}>
          <option value="video">Video</option>
          <option value="episode">Podcast episode</option>
          <option value="article">Article</option>
        </select>
      </label>

      <label className="field">
        <span>One line about it</span>
        <input name="summary" defaultValue={item?.summary ?? ""} />
      </label>

      <label className="field">
        <span>Link</span>
        <input
          name="external_url"
          defaultValue={item?.external_url ?? ""}
          placeholder="YouTube, podcast or wherever it lives"
        />
      </label>

      <label className="field">
        <span>Length</span>
        <input name="duration" defaultValue={item?.duration ?? ""} placeholder="14 minutes" />
      </label>

      <label className="field">
        <span>Notes or transcript</span>
        <textarea name="body" rows={4} defaultValue={item?.body ?? ""} />
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="member_only"
          defaultChecked={item?.member_only ?? false}
        />
        <span>
          <b>Members only</b>
          <small>Otherwise it appears on the public site as well.</small>
        </span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          name="publish"
          defaultChecked={Boolean(item?.published_at) || !item}
        />
        <span>
          <b>Published</b>
          <small>Turn it off to keep it as a draft.</small>
        </span>
      </label>

      <label className="field">
        <span>Part of which show</span>
        <input
          name="show_slug"
          defaultValue={item?.show_slug ?? ""}
          placeholder="expatpreneurs, or leave empty for a video"
        />
      </label>

      <label className="field">
        <span>Episode number</span>
        <input
          name="episode_number"
          type="number"
          min={1}
          defaultValue={item?.episode_number ?? ""}
        />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}