"use client";

import { useActionState } from "react";
import { messageLearners, type SalesState } from "./actions";

export function MessageLearnersForm({
  courses,
}: {
  courses: { id: string; title: string; buyers: number }[];
}) {
  const [state, action, pending] = useActionState<SalesState, FormData>(
    messageLearners,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>Write to the people who bought a course</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">{state.done}.</div> : null}

      <label className="field">
        <span>Which course</span>
        <select name="course_id" defaultValue={courses[0]?.id}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.buyers})
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Subject</span>
        <input name="subject" required placeholder="A new lesson is up" />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea name="body" rows={5} required />
      </label>

      <p className="muted small">
        Members get it in the platform and by email if they asked for email.
        People who bought from outside get it by email, since that is the
        only address we have.
      </p>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send it"}
      </button>
    </form>
  );
}