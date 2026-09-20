"use client";

import { useActionState } from "react";
import { buyCourse, type BuyState } from "./checkout";

export function BuyButton({
  slug,
  label,
}: {
  slug: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<BuyState, FormData>(
    buyCourse,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      <input type="hidden" name="slug" value={slug} />
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Opening checkout" : label}
      </button>
    </form>
  );
}