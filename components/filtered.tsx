"use client";

import { useState } from "react";

// A row of chips above a list, filtering what is already on the page.
// The block decides what the chips are; this only shows them and hides
// what does not match.
export function Filtered({
  chips,
  children,
}: {
  chips: string[];
  children: React.ReactNode[];
}) {
  const [on, setOn] = useState("");

  return (
    <>
      <div className="filters">
        <button
          type="button"
          className={`fchip ${on ? "" : "on"}`}
          onClick={() => setOn("")}
        >
          All
        </button>
        {chips
          .filter((c, i) => c && chips.indexOf(c) === i)
          .map((c) => (
            <button
              type="button"
              key={c}
              className={`fchip ${on === c ? "on" : ""}`}
              onClick={() => setOn(c)}
            >
              {c}
            </button>
          ))}
      </div>
      {children.filter((_, i) => !on || chips[i] === on)}
    </>
  );
}

// The search box on Discover, filtering the cards below it as you type.
export function Searchable({
  placeholder,
  terms,
  children,
}: {
  placeholder: string;
  terms: string[];
  children: React.ReactNode[];
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = children.filter(
    (_, i) => !needle || (terms[i] ?? "").toLowerCase().includes(needle)
  );

  return (
    <>
      <label className="input dsearch">
        <input
          value={q}
          placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {needle ? (
        <p className="dcount">
          {shown.length} {shown.length === 1 ? "result" : "results"}
        </p>
      ) : null}
      {shown}
    </>
  );
}