"use client";

import { useActionState } from "react";
import {
  saveEvent,
  decideRegistration,
  checkInGuest,
  type EventFormState,
} from "./actions";
import { Uploader } from "@/components/uploader";

type Option = { value: string; label: string };

export function EventForm({
  audiences,
  event,
}: {
  audiences: Option[];
  event?: {
    id: string;
    title: string;
    description: string | null;
    starts_at: string;
    venue: string | null;
    capacity: number;
    visitor_places: number;
    price_cents: number;
    currency: string;
    visibility: string;
    audience: string;
    audience_id: string | null;
    tier: string;
    requires_approval: boolean;
    show_guest_list: boolean;
    reminders: Record<string, boolean>;
    cover_url?: string | null;
    address?: string | null;
    release_hours?: number | null;
    status?: string;
  };
}) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(
    saveEvent,
    {}
  );

  const start = event ? new Date(event.starts_at) : null;
  const dateValue = start ? start.toISOString().slice(0, 10) : "";
  const timeValue = start ? start.toISOString().slice(11, 16) : "";
  const currentAudience = event
    ? event.audience === "circle"
      ? `circle:${event.audience_id}`
      : event.audience === "global"
        ? "global"
        : `village:${event.audience_id}`
    : audiences[0]?.value;

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      <div className="panel" style={{ maxWidth: 820 }}>
        <h3>The event</h3>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Title</span>
          <input name="title" required defaultValue={event?.title ?? ""} />
        </label>
        <div className="two">
          <label className="field">
            <span>Date</span>
            <input name="date" type="date" required defaultValue={dateValue} />
          </label>
          <label className="field">
            <span>Start time</span>
            <input name="time" type="time" required defaultValue={timeValue} />
          </label>
        </div>
        <div className="two">
          <label className="field">
            <span>End time</span>
            <input name="end_time" type="time" />
          </label>
          <label className="field">
            <span>Time zone</span>
            <select name="timezone" defaultValue="Asia/Dubai">
              <option value="Asia/Dubai">Dubai</option>
              <option value="Europe/Lisbon">Lisbon</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Madrid">Madrid</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Venue</span>
          <input name="venue" defaultValue={event?.venue ?? ""} />
          <span className="hint">
            The name of the place, which everyone can see. Write Online for a
            call.
          </span>
        </label>
        <div className="two">
          <label className="field">
            <span>Full address, or the link for a call</span>
            <input name="address" defaultValue={event?.address ?? ""} />
            <span className="hint">
              Only people who are going see this, and only near the time.
            </span>
          </label>
          <label className="field">
            <span>Show it how many hours before?</span>
            <input
              name="release_hours"
              type="number"
              min={1}
              max={336}
              defaultValue={event?.release_hours ?? 48}
            />
          </label>
        </div>
        <Uploader
          name="cover_url"
          folder="events"
          label="Cover image"
          hint="Wide works best. A photograph of the last one beats a graphic."
          current={event?.cover_url}
        />
        <label className="field">
          <span>Description</span>
          <textarea name="description" rows={4} defaultValue={event?.description ?? ""} />
        </label>
      </div>

      <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
        <h3>Who can see it and register</h3>
        <label className="check" style={{ marginTop: 12 }}>
          <input
            type="radio"
            name="visibility"
            value="public"
            defaultChecked={event?.visibility === "public"}
          />
          <span>
            <b>Public</b>
            <small>
              Anyone, on or off the platform, can open the page and register.
            </small>
          </span>
        </label>
        <label className="check">
          <input
            type="radio"
            name="visibility"
            value="private"
            defaultChecked={event ? event.visibility !== "public" : true}
          />
          <span>
            <b>Private</b>
            <small>Only members can see it. Choose which members below.</small>
          </span>
        </label>

        <div className="two">
          <label className="field">
            <span>Which members</span>
            <select name="audience" defaultValue={currentAudience}>
              {audiences.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Membership</span>
            <select name="tier" defaultValue={event?.tier ?? "all"}>
              <option value="all">All members</option>
              <option value="paid">Paid members only</option>
            </select>
            <span className="hint">
              Members from other Villages already need the paid plan to attend.
            </span>
          </label>
        </div>

        <label className="check">
          <input
            type="checkbox"
            name="requires_approval"
            defaultChecked={event?.requires_approval ?? false}
          />
          <span>
            <b>Approve each registration</b>
            <small>Registrations wait on your list until you accept them.</small>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="show_guest_list"
            defaultChecked={event?.show_guest_list ?? true}
          />
          <span>
            <b>Show the guest list to people who register</b>
            <small>Seeing who is coming is half the reason people come.</small>
          </span>
        </label>
      </div>

      <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
        <h3>Places and tickets</h3>
        <div className="two">
          <label className="field">
            <span>Capacity</span>
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={event?.capacity ?? 30}
            />
          </label>
          <label className="field">
            <span>Places for visiting members</span>
            <input
              name="visitor_places"
              type="number"
              min={0}
              defaultValue={event?.visitor_places ?? 0}
            />
          </label>
        </div>
        <div className="two">
          <label className="field">
            <span>Ticket price</span>
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={event ? event.price_cents / 100 : 0}
            />
            <span className="hint">Zero is free. A small ticket makes people turn up.</span>
          </label>
          <label className="field">
            <span>Currency</span>
            <select name="currency" defaultValue={event?.currency ?? "AED"}>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Refunds</span>
          <select name="refund_policy" defaultValue="48h">
            <option value="48h">Up to 48 hours before</option>
            <option value="none">No refunds</option>
            <option value="case">Case by case</option>
          </select>
        </label>
      </div>

      <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
        <h3>Reminders</h3>
        <p className="muted small">
          Sent by email and in the platform to everyone registered.
        </p>
        <label className="check">
          <input type="checkbox" name="remind_week" defaultChecked={event?.reminders?.week} />
          <span>
            <b>One week before</b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="remind_day"
            defaultChecked={event?.reminders?.day ?? true}
          />
          <span>
            <b>The day before</b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="remind_hour"
            defaultChecked={event?.reminders?.hour ?? true}
          />
          <span>
            <b>One hour before</b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="remind_changes"
            defaultChecked={event?.reminders?.changes ?? true}
          />
          <span>
            <b>When the time, place or host changes</b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="remind_thanks"
            defaultChecked={event?.reminders?.thanks ?? true}
          />
          <span>
            <b>A thank you the day after, with the next event</b>
          </span>
        </label>
      </div>

      {event ? (
        <div className="panel" style={{ maxWidth: 820, marginTop: 16 }}>
          <h3>Is it still on?</h3>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Status</span>
            <select name="status" defaultValue={event.status ?? "published"}>
              <option value="published">On, and members can see it</option>
              <option value="draft">A draft, nobody sees it</option>
              <option value="cancelled">Called off</option>
            </select>
            <span className="hint">
              Calling it off tells everybody who was coming, on the platform
              and by email. Moving the time or the place tells them too.
            </span>
          </label>
        </div>
      ) : null}

      <p style={{ marginTop: 16 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Saving" : event ? "Save changes" : "Publish event"}
        </button>
      </p>
    </form>
  );
}

export function DecisionButtons({
  registrationId,
  eventId,
}: {
  registrationId: string;
  eventId: string;
}) {
  const [, action, pending] = useActionState<EventFormState, FormData>(
    decideRegistration,
    {}
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="registration_id" value={registrationId} />
      <input type="hidden" name="event_id" value={eventId} />
      <button className="btn primary" name="decision" value="confirmed" disabled={pending}>
        Approve
      </button>
      <button className="btn" name="decision" value="declined" disabled={pending}>
        Decline
      </button>
    </form>
  );
}

export function CheckInButton({
  registrationId,
  eventId,
  checkedIn,
}: {
  registrationId: string;
  eventId: string;
  checkedIn: boolean;
}) {
  const [, action, pending] = useActionState<EventFormState, FormData>(
    checkInGuest,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="registration_id" value={registrationId} />
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="checked_in" value={checkedIn ? "1" : "0"} />
      <button
        className={`btn ${checkedIn ? "mint" : ""}`}
        type="submit"
        disabled={pending}
      >
        {checkedIn ? "Here" : "Check in"}
      </button>
    </form>
  );
}