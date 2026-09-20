"use client";

import { useActionState } from "react";
import { addPhoto, removePhoto, type PhotoState } from "./actions";
import { Uploader } from "@/components/uploader";

export function PhotoForm({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<PhotoState, FormData>(
    addPhoto,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {state.done ? <div className="notice good">Up it goes.</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />

      <Uploader
        name="photo_url"
        folder="events"
        label="Add a photograph"
        hint="Only people who were there can put these up."
      />

      <label className="field">
        <span>A line about it</span>
        <input name="caption" placeholder="Who is in it, or what was happening" />
      </label>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add it"}
      </button>
    </form>
  );
}

export function RemovePhoto({
  photoId,
  slug,
}: {
  photoId: string;
  slug: string;
}) {
  const [, action, pending] = useActionState<PhotoState, FormData>(
    removePhoto,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="photo_id" value={photoId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Removing" : "Take it down"}
      </button>
    </form>
  );
}