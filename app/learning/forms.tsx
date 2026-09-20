"use client";

import { useActionState } from "react";
import { enrol, markLesson, type LearningState } from "./actions";

export function EnrolButton({
  courseId,
  slug,
}: {
  courseId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<LearningState, FormData>(
    enrol,
    {}
  );

  if (state.done === "enrolled") {
    return <div className="notice good">You are in. Start with the first lesson.</div>;
  }

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Starting" : "Start the course"}
      </button>
    </form>
  );
}

export function LessonDone({
  lessonId,
  courseId,
  slug,
  done,
}: {
  lessonId: string;
  courseId: string;
  slug: string;
  done: boolean;
}) {
  const [, action, pending] = useActionState<LearningState, FormData>(
    markLesson,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="done" value={done ? "1" : "0"} />
      <button
        className={`btn ${done ? "mint" : "primary"}`}
        type="submit"
        disabled={pending}
      >
        {pending ? "Saving" : done ? "Done" : "Mark as done"}
      </button>
    </form>
  );
}