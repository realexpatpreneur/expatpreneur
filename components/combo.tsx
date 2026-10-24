"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ic } from "@/components/icon";
import { ALIASES, fold, splitVals } from "@/lib/lists";

// The prototype's combo(): a field you type into that searches a list
// and gives you back only entries that are on it. Multi fields collect
// pills; single fields hold one value and revert anything that is not
// on the list, unless the field allows a new one.
//
// The value leaves in a hidden input under the field's own name, comma
// separated, which is what the server actions already read. Nothing on
// the server side changes.

type Props = {
  name: string;
  label: string;
  // The list this field searches, handed in by the page so that a page
  // only carries the lists its own fields use.
  options: readonly string[];
  multi?: boolean;
  max?: number;
  value?: string | string[] | null;
  placeholder?: string;
  hint?: string;
  icon?: string;
  required?: boolean;
  full?: boolean;
  allowNew?: boolean;
};

export function Combo({
  name,
  label,
  options,
  multi = false,
  max,
  value = "",
  placeholder = "Search and select",
  hint,
  icon,
  required = false,
  full = false,
  allowNew = false,
}: Props) {
  const id = useId();

  const [picked, setPicked] = useState<string[]>(() =>
    multi ? splitVals(value, options) : []
  );
  // For a single field: the value that is actually on the list, and the
  // text in the box, which may be mid-typing.
  const [valid, setValid] = useState(() => {
    if (multi) return "";
    const one = splitVals(value, options)[0];
    return one ?? (allowNew ? String(value ?? "") : "");
  });
  const [text, setText] = useState(valid);
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);

  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // The typed query. A single field showing its own valid value is not
  // searching for it, so the whole list stays available.
  const raw = multi ? text.trim() : text === valid ? "" : text.trim();
  const q = fold(raw);

  const chosen = new Set(picked);
  let matches = options.filter((x) => !chosen.has(x));
  if (q) {
    const starts: string[] = [];
    const word: string[] = [];
    const has: string[] = [];
    for (const x of matches) {
      const f = fold(x);
      const extra =
        fold(ALIASES[x] ?? "") + " " + fold(ALIASES[x.split(", ").pop() ?? ""] ?? "");
      if (f.startsWith(q)) starts.push(x);
      else if (
        f.split(/[\s,()'-]+/).some((w) => w.startsWith(q)) ||
        extra.split(/\s+/).some((w) => w && w.startsWith(q))
      )
        word.push(x);
      else if (f.includes(q)) has.push(x);
    }
    matches = [...starts, ...word, ...has];
  }

  const atMax = Boolean(multi && max && picked.length >= max);
  const shown = atMax ? [] : matches.slice(0, 80);
  const duplicate = [...chosen].find((x) => fold(x).startsWith(q));
  const offerNew = Boolean(allowNew && raw && !shown.length && !duplicate && !atMax);
  const pickable = offerNew ? [raw] : shown;

  useEffect(() => {
    setAct(0);
  }, [text, picked.length]);

  // Closing the field: a multi field clears what you were typing, a
  // single one keeps only a value the list knows.
  const close = () => {
    setOpen(false);
    if (multi) {
      setText("");
      return;
    }
    const typed = text.trim();
    if (typed !== valid) {
      const exact = options.find((x) => fold(x) === fold(typed));
      const next = exact ?? (allowNew && typed ? typed : valid);
      setValid(next);
      setText(next);
    }
  };

  const pick = (v: string) => {
    if (multi) {
      if (max && picked.length >= max) return;
      setPicked([...picked, v]);
      setText("");
      input.current?.focus();
    } else {
      setValid(v);
      setText(v);
      setOpen(false);
    }
  };

  const remove = (v: string) => {
    setPicked(picked.filter((x) => x !== v));
    input.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setAct((i) => Math.min(pickable.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAct((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (open && pickable[act] !== undefined) {
        e.preventDefault();
        pick(pickable[act]);
      }
    } else if (e.key === "Escape") {
      close();
    } else if (e.key === "Backspace" && multi && !text && picked.length) {
      remove(picked[picked.length - 1]);
    }
  };

  // Clicking away closes it. A click inside the menu is handled on
  // mousedown, before the blur, so the pick still lands.
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  });

  const ph = multi && picked.length ? "Add another" : placeholder;

  // A hidden input is skipped by the browser's own checks, so a required
  // field puts the requirement on the box you can actually see, and
  // takes it off once something is chosen.
  const needed = required && !(multi ? picked.length : valid);

  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label htmlFor={id}>{label}</label>

      <input
        type="hidden"
        name={name}
        value={multi ? picked.join(", ") : valid}
      />

      <div
        className={`combo ${multi ? "multi" : ""} ${open ? "open" : ""}`}
        ref={box}
      >
        <div className="cbox" onClick={() => input.current?.focus()}>
          {icon ? <Ic name={icon} /> : null}
          {picked.map((v) => (
            <span className="cpill" key={v}>
              {v}
              <button
                type="button"
                className="cx"
                aria-label={`Remove ${v}`}
                onClick={() => remove(v)}
              >
                <Ic name="x" />
              </button>
            </span>
          ))}
          <input
            id={id}
            ref={input}
            className="cin"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={`${id}-list`}
            aria-activedescendant={
              open && pickable.length ? `${id}-o${act}` : undefined
            }
            autoComplete="off"
            value={text}
            placeholder={ph}
            required={needed}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
          />
          <span
            className="cchev"
            onMouseDown={(e) => {
              e.preventDefault();
              if (open) close();
              else {
                setOpen(true);
                input.current?.focus();
              }
            }}
          >
            <Ic name="chevd" />
          </span>
        </div>

        {open ? (
          <div
            className="cmenu"
            id={`${id}-list`}
            role="listbox"
            aria-multiselectable={multi || undefined}
          >
            {atMax ? (
              <div className="cnote">
                You can choose up to {max}. Remove one to add another.
              </div>
            ) : offerNew ? (
              <>
                <div
                  className="copt act"
                  role="option"
                  aria-selected={false}
                  id={`${id}-o0`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(raw);
                  }}
                >
                  <span>Use &quot;{raw}&quot;</span>
                </div>
                <div className="cnote">
                  Not on our list yet. You can still use it.
                </div>
              </>
            ) : shown.length ? (
              <>
                {shown.map((x, i) => (
                  <div
                    className={`copt ${i === act ? "act" : ""}`}
                    role="option"
                    aria-selected={!multi && x === valid}
                    id={`${id}-o${i}`}
                    key={x}
                    onMouseEnter={() => setAct(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(x);
                    }}
                  >
                    <span>{mark(x, q)}</span>
                    {!multi && x === valid ? <Ic name="check" /> : null}
                  </div>
                ))}
                {matches.length > shown.length ? (
                  <div className="cnote">
                    Keep typing to narrow {matches.length} results
                  </div>
                ) : null}
              </>
            ) : duplicate ? (
              <div className="cnote">{duplicate} is already selected.</div>
            ) : (
              <div className="cnote">
                No match for &quot;{raw}&quot;. Check the spelling or try
                another name.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

// The matched run of letters, in blue, accents ignored when matching but
// kept when shown.
function mark(text: string, q: string) {
  if (!q) return text;
  const chars = [...text];
  const folded = chars.map((ch) => fold(ch)).join("");
  const i = folded.indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {chars.slice(0, i).join("")}
      <mark>{chars.slice(i, i + q.length).join("")}</mark>
      {chars.slice(i + q.length).join("")}
    </>
  );
}