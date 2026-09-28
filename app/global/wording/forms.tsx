"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveWording, type WordingState } from "./actions";
import type { TextKey } from "@/lib/text-keys";

export function WordingForm({
  page,
  path,
  keys,
  current,
}: {
  page: string;
  path: string;
  keys: TextKey[];
  current: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<WordingState, FormData>(
    saveWording,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="page" value={page} />

      {state.done ? (
        <div className="flag ok" style={{ marginBottom: 14 }}>
          Saved. The page shows the new wording straight away.
        </div>
      ) : null}
      {state.error ? (
        <div className="flag hold" style={{ marginBottom: 14 }}>
          {state.error}
        </div>
      ) : null}

      <div className="stack" style={{ maxWidth: 820 }}>
        {keys.map((k) => (
          <div className="panel" key={k.key}>
            <label className="field">
              <span>{k.label}</span>
              {k.long ? (
                <textarea
                  name={`v.${k.key}`}
                  rows={3}
                  defaultValue={current[k.key] ?? ""}
                  placeholder={k.fallback}
                />
              ) : (
                <input
                  name={`v.${k.key}`}
                  defaultValue={current[k.key] ?? ""}
                  placeholder={k.fallback}
                />
              )}
            </label>
            <p className="muted small" style={{ marginTop: 8 }}>
              As written in the build: {k.fallback}
            </p>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save wording"}
        </button>
        <Link className="btn btn-ghost" href={path} target="_blank">
          See the page
        </Link>
        <Link className="btn btn-ghost" href="/global/wording">
          Back
        </Link>
      </div>
    </form>
  );
}