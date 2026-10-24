# 129-forms-that-are-not-broken.ps1
# The reason every form on the site looks wrong. No migration.
#
# It is one fault, not a hundred. The stylesheet came from the
# prototype, where a field is a div holding a caption and an .input
# box. This build writes a field as a single label with a span caption
# and a plain control, and it does that 349 times across 59 files.
# None of the field rules ever matched. That is why the caption sits on
# top of the control, why the control has no box, and why a button
# touches the field above it on every form you have opened.
#
# Fixing the stylesheet reaches all 349 at once, so nothing had to be
# rewritten. app/forms.css now gives that shape the caption spacing,
# the bordered control with its focus ring, and room between a field
# and whatever follows it. Grids keep their own gap and are left alone.
#
# The overflowing list on Photos and consent was the same class of
# thing: a plain list inside a panel had no styling at all, so it ran
# straight into the paragraph beneath it. Plain lists in panels are
# styled now, everywhere.
#
# And the prose editor you asked for. Anywhere the wording is a
# paragraph rather than a line, the Wording screens now use it: bold,
# italic, a heading, a list, a link, and a preview. It writes Markdown,
# so what is stored stays readable and is not locked to this editor.
#
# Still to come, in this order: the prose editor on the Pages and
# Articles editors, the remaining nine pages wired to Wording, and then
# the member and admin workspaces, which is the larger of the two
# things you asked for and I want to scope properly rather than guess.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\app\forms.css
#   C:\Users\HP\Desktop\expatpreneur\app\layout.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\rich-text.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\wording\forms.tsx
#
#   powershell -ExecutionPolicy Bypass -File .\129-forms-that-are-not-broken.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $full"
}

$f0 = @'
/* ===== Fields, as this build writes them =====
   The prototype wraps a caption and an .input box in a div, and the
   rules above were written for that. This build writes one label with
   a span caption and a plain control, 349 of them, so the same styling
   has to reach that shape too. Without this the caption sits on the
   control, the control has no box, and a button touches the field
   above it. */
.app .field > span{display:block;font-weight:600;font-size:12.5px;margin-bottom:6px;color:var(--navy)}
.app .field > span.hint{font-weight:400;font-size:12px;color:var(--muted);margin:6px 0 0}
.app .field > input,
.app .field > select,
.app .field > textarea{
  display:block;width:100%;font:inherit;color:var(--navy);background:#fff;
  border:1px solid #C7CDD4;border-radius:14px;padding:10px 12px;
  box-shadow:inset 0 2px 4px rgba(15,20,25,.07),0 1px 3px rgba(15,20,25,.07)}
.app .field > textarea{min-height:88px;line-height:1.5;resize:vertical}
.app .field > select{appearance:auto;padding-right:8px}
.app .field > input:hover,.app .field > select:hover,.app .field > textarea:hover{border-color:#B6BDC6}
.app .field > input:focus,.app .field > select:focus,.app .field > textarea:focus{
  outline:0;border-color:var(--blue);
  box-shadow:0 0 0 4px rgba(64,116,174,.18),inset 0 2px 4px rgba(15,20,25,.06)}
.app .field > input::placeholder,.app .field > textarea::placeholder{color:#98A2AD}

/* Room between stacked fields, and between a field and whatever comes
   after it. Grids keep their own gap, so they are left alone. */
.app *:not(.formgrid):not(.g2):not(.g3):not(.g4):not(.choicegrid):not(.stackform) > .field + .field,
.app .field + .btn,
.app .field + button,
.app .field + .row,
.app .field + .stack,
.app .field + .flag,
.app .field + .check,
.app .field + .radio,
.app .field + p{margin-top:14px}
.app form > .btn,
.app form > button{margin-top:14px}
.app .formgrid + .btn,
.app .formgrid + .row,
.app .stackform + .btn,
.app .stackform + .row{margin-top:16px}

/* A plain list inside a panel had no styling at all, so it ran into
   whatever followed it. */
.app .panel ul:not([class]){margin:10px 0 0;padding-left:20px;display:grid;gap:6px}
.app .panel ul:not([class]) + p{margin-top:12px}
.app .panel > h3 + p,
.app .panel > h3 + .muted{margin-top:6px}
.app .panel > * + .divide{margin-top:10px}

/* ===== The small prose editor ===== */
.rt{border:1px solid #C7CDD4;border-radius:14px;overflow:hidden;background:#fff;
  box-shadow:inset 0 2px 4px rgba(15,20,25,.05)}
.rt-bar{display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:1px solid var(--line);background:var(--wash)}
.rt-bar button{border:1px solid transparent;background:transparent;border-radius:8px;padding:4px 10px;
  font:600 12.5px var(--body);color:#3B4650;cursor:pointer}
.rt-bar button:hover{background:#fff;border-color:var(--line)}
.rt-bar button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.rt-spacer{flex:1}
.app .rt textarea{border:0;border-radius:0;box-shadow:none;min-height:150px;padding:12px 14px}
.app .rt textarea:focus{box-shadow:none;border:0}
.rt-preview{padding:14px;min-height:150px}
.rt-preview h2{font-size:18px;margin:14px 0 6px}
.rt-preview h3{font-size:15px;margin:14px 0 6px}
.rt-preview p{margin:0 0 10px!important}
.rt-preview ul{margin:0 0 10px;padding-left:20px;display:grid;gap:6px}
.rt-preview a{color:var(--blue)}
'@
Write-File "app\forms.css" $f0

$f1 = @'
import type { Metadata } from "next";
import "./globals.css";
// Field, button and list spacing this build needs on top of the
// prototype stylesheet. Kept separate so it stays easy to read.
import "./forms.css";
import { siteUrl, siteName, siteDescription } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  // Every page's own title and description hang off this one.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s`,
  },
  description: siteDescription,
  // What a link looks like when somebody drops it into WhatsApp or
  // LinkedIn, which is how most people will first see this.
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
'@
Write-File "app\layout.tsx" $f1

$f2 = @'
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
'@
Write-File "components\rich-text.tsx" $f2

$f3 = @'
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveWording, type WordingState } from "./actions";
import type { TextKey } from "@/lib/text-keys";
import { RichText } from "@/components/rich-text";

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
                <RichText
                  name={`v.${k.key}`}
                  defaultValue={current[k.key] ?? ""}
                  placeholder={k.fallback}
                  rows={4}
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
'@
Write-File "app\global\wording\forms.tsx" $f3

git add app components
git commit -m "Style the fields this build actually writes, and add a prose editor"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Nothing to run in Supabase for this one."
    Write-Host "Look at any form afterwards: Contact, the invitation form,"
    Write-Host "or Photos and consent."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
