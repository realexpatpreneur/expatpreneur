"use client";

import { useRef, useState } from "react";

// A small editor for the places that hold real prose. It writes
// Markdown, so what is stored stays readable and can be shown anywhere
// without a special renderer, and nothing is lost if this component is
// ever replaced.
export function RichText({
  name,
  defaultValue = "",
  placeholder,
  rows = 8,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  function wrap(before: string, after = before) {
    const el = box.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const chosen = value.slice(a, b) || "text";
    const next = value.slice(0, a) + before + chosen + after + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, a + before.length + chosen.length);
    });
  }

  function line(prefix: string) {
    const el = box.current;
    if (!el) return;
    const a = value.lastIndexOf("\n", Math.max(0, el.selectionStart - 1)) + 1;
    setValue(value.slice(0, a) + prefix + value.slice(a));
    requestAnimationFrame(() => el.focus());
  }

  return (
    <div className="rt">
      <div className="rt-bar">
        <button type="button" onClick={() => wrap("**")} title="Bold">
          <b>B</b>
        </button>
        <button type="button" onClick={() => wrap("_")} title="Italic">
          <i>I</i>
        </button>
        <button type="button" onClick={() => line("## ")} title="Heading">
          H
        </button>
        <button type="button" onClick={() => line("- ")} title="List">
          List
        </button>
        <button type="button" onClick={() => wrap("[", "](https://)")} title="Link">
          Link
        </button>
        <span className="rt-spacer" />
        <button
          type="button"
          className={preview ? "on" : ""}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Write" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="rt-preview" dangerouslySetInnerHTML={{ __html: toHtml(value) }} />
      ) : (
        <textarea
          ref={box}
          name={name}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      {preview ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}

// Enough Markdown for the wording on a page: headings, bold, italic,
// links and lists. Everything else is shown as plain text, and every
// value is escaped before any of it is applied.
export function toHtml(md: string) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = esc(md).split("\n");
  const out: string[] = [];
  let list = false;

  const inline = (s: string) =>
    s
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/_([^_]+)_/g, "<i>$1</i>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
        '<a href="$2">$1</a>'
      );

  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith("- ")) {
      if (!list) { out.push("<ul>"); list = true; }
      out.push(`<li>${inline(l.slice(2))}</li>`);
      continue;
    }
    if (list) { out.push("</ul>"); list = false; }
    if (!l) continue;
    if (l.startsWith("## ")) out.push(`<h3>${inline(l.slice(3))}</h3>`);
    else if (l.startsWith("# ")) out.push(`<h2>${inline(l.slice(2))}</h2>`);
    else out.push(`<p>${inline(l)}</p>`);
  }
  if (list) out.push("</ul>");
  return out.join("");
}