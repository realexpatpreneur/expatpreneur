"use client";

import { useActionState } from "react";
import {
  saveCourse,
  saveLesson,
  deleteLesson,
  type EducatorState,
} from "./actions";
import { Uploader } from "@/components/uploader";

export function CourseForm({
  course,
}: {
  course?: {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    level: string;
    duration: string | null;
    format?: string | null;
    starts_at?: string | null;
    tier: string;
    status: string;
    cover_url?: string | null;
    price_cents?: number;
    member_price_cents?: number | null;
    currency?: string;
    public_listing?: boolean;
  };
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    saveCourse,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{course ? course.title : "New course"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {course ? <input type="hidden" name="id" value={course.id} /> : null}

      <Uploader
        name="cover_url"
        folder="courses"
        label="Cover image"
        current={course?.cover_url}
      />

      <label className="field">
        <span>Title</span>
        <input name="title" required defaultValue={course?.title ?? ""} />
      </label>

      <label className="field">
        <span>One line</span>
        <input name="summary" defaultValue={course?.summary ?? ""} />
      </label>

      <label className="field">
        <span>What it covers</span>
        <textarea name="description" rows={4} defaultValue={course?.description ?? ""} />
      </label>

      <div className="g2">
        <label className="field">
          <span>Live or recorded</span>
          <select name="format" defaultValue={course?.format ?? "recorded"}>
            <option value="recorded">Recorded, taken any time</option>
            <option value="live">Live workshop, on a date</option>
          </select>
        </label>
        <label className="field">
          <span>When, if it is live</span>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={course?.starts_at ? course.starts_at.slice(0, 16) : ""}
          />
          <span className="hint">Leave it empty for anything recorded.</span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Who it is for</span>
          <select name="level" defaultValue={course?.level ?? "anyone"}>
            <option value="anyone">Anyone</option>
            <option value="starting out">Starting out</option>
            <option value="running it">Already running it</option>
          </select>
        </label>
        <label className="field">
          <span>How long</span>
          <input
            name="duration"
            defaultValue={course?.duration ?? ""}
            placeholder="4 lessons, about an hour"
          />
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Price for everybody</span>
          <input
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={(course?.price_cents ?? 0) / 100}
          />
          <span className="hint">Zero is free.</span>
        </label>
        <label className="field">
          <span>Price for members</span>
          <input
            name="member_price"
            type="number"
            min={0}
            step="1"
            defaultValue={
              course?.member_price_cents === null ||
              course?.member_price_cents === undefined
                ? ""
                : course.member_price_cents / 100
            }
            placeholder="Same as above"
          />
          <span className="hint">
            Leave it empty to charge members the same.
          </span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={course?.currency ?? "EUR"}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="field">
          <span>Who can take it</span>
          <select name="tier" defaultValue={course?.tier ?? "all"}>
            <option value="all">Every member</option>
            <option value="paid">Paid members only</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={course?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          name="public_listing"
          defaultChecked={course?.public_listing ?? true}
        />
        <span>
          <b>Sell it to people who are not members</b>
          <small>
            Off keeps it inside the network. On means it appears on the public
            learning page, which is how somebody finds their way in.
          </small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function LessonForm({
  courseId,
  nextPosition,
  lesson,
}: {
  courseId: string;
  nextPosition: number;
  lesson?: {
    id: string;
    position: number;
    title: string;
    body: string | null;
    video_url: string | null;
    duration: string | null;
  };
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    saveLesson,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{lesson ? `${lesson.position}. ${lesson.title}` : "New lesson"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="course_id" value={courseId} />
      {lesson ? <input type="hidden" name="id" value={lesson.id} /> : null}

      <div className="g2" style={{ marginTop: 10 }}>
        <label className="field">
          <span>Position</span>
          <input
            name="position"
            type="number"
            min={1}
            defaultValue={lesson?.position ?? nextPosition}
          />
        </label>
        <label className="field">
          <span>How long</span>
          <input name="duration" defaultValue={lesson?.duration ?? ""} placeholder="12 minutes" />
        </label>
      </div>

      <label className="field">
        <span>Title</span>
        <input name="title" required defaultValue={lesson?.title ?? ""} />
      </label>

      <label className="field">
        <span>Video link</span>
        <input name="video_url" defaultValue={lesson?.video_url ?? ""} placeholder="https://" />
      </label>

      <label className="field">
        <span>The lesson</span>
        <textarea name="body" rows={6} defaultValue={lesson?.body ?? ""} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function DeleteLessonButton({
  id,
  courseId,
}: {
  id: string;
  courseId: string;
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    deleteLesson,
    {}
  );

  return (
    <form action={action} style={{ marginTop: 10 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="course_id" value={courseId} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Taking it down" : "Take this lesson down"}
      </button>
    </form>
  );
}