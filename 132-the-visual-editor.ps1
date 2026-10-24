# 132-the-visual-editor.ps1
# A canvas you drag blocks around on, not a form with numbers in it.
# No migration.
#
# You are right about what I sent. This replaces it.
#
# Opening a page in Pages now shows the page itself, rendered, block by
# block. Every block on that canvas can be:
#
#   dragged onto another block to move it there
#   nudged up or down with the arrows in its toolbar
#   duplicated
#   removed
#   clicked, which opens its own fields on the right
#
# Hovering between blocks shows a plus, which opens the palette of all
# nineteen block types with a line about each, and inserts the new one
# in that spot rather than at the end.
#
# What you edit on the right redraws on the canvas as you type, because
# the canvas uses the same components the live page uses and the same
# rows from the database. The Villages block shows your real Villages.
# The events block shows your real events.
#
# Save as draft or Publish sit at the top and stay there while you
# scroll.
#
# What it is not: it does not let you invent new kinds of section, and
# it does not let you set a colour on any element. A block is a section
# of the design with its own settings, which is how the prototype is
# built. If you want a section the catalogue does not have, tell me and
# it becomes a block type.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\components\page-builder.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\rich-text.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\uploader.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\content\[slug]\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\content\actions.ts
#   C:\Users\HP\Desktop\expatpreneur\app\forms.css
#
#   powershell -ExecutionPolicy Bypass -File .\132-the-visual-editor.ps1

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
"use client";

import { useState } from "react";
import { BLOCKS, blockLabel, blockSpec, type Block, type BlockField } from "@/lib/blocks";
import { Blocks, type BlockData } from "@/components/blocks";
import { RichText } from "@/components/rich-text";
import { Uploader } from "@/components/uploader";
import { Ic } from "@/components/icon";
import { saveBlocks, type PageState } from "@/app/global/content/actions";

// The page, as a canvas. Blocks are shown as they will look, dragged
// to reorder, and clicked to edit. Nothing here is a numbered list of
// fields pretending to be a page.
export function PageBuilder({
  slug,
  title,
  path,
  status,
  initial,
  data,
}: {
  slug: string;
  title: string;
  path: string;
  status: string;
  initial: Block[];
  data: BlockData;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [picked, setPicked] = useState<number | null>(initial.length ? 0 : null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [state, setState] = useState<PageState>({});
  const [saving, setSaving] = useState(false);

  const change = (next: Block[]) => {
    setBlocks(next);
    setState({});
  };

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    change(next);
    setPicked(to);
  }

  function nudge(i: number, by: number) {
    const to = Math.max(0, Math.min(blocks.length - 1, i + by));
    move(i, to);
  }

  function add(type: string, at?: number) {
    const b: Block = { type };
    const next = [...blocks];
    const where = at ?? blocks.length;
    next.splice(where, 0, b);
    change(next);
    setPicked(where);
    setAdding(false);
  }

  function remove(i: number) {
    const next = blocks.filter((_, n) => n !== i);
    change(next);
    setPicked(next.length ? Math.max(0, i - 1) : null);
  }

  function duplicate(i: number) {
    const next = [...blocks];
    next.splice(i + 1, 0, { ...blocks[i] });
    change(next);
    setPicked(i + 1);
  }

  function set(i: number, name: string, value: string) {
    const next = blocks.map((b, n) => (n === i ? { ...b, [name]: value } : b));
    setBlocks(next);
  }

  async function save(publish: boolean) {
    setSaving(true);
    const result = await saveBlocks({
      slug,
      blocks,
      status: publish ? "live" : "draft",
    });
    setState(result);
    setSaving(false);
  }

  const current = picked != null ? blocks[picked] : null;
  const spec = current ? blockSpec(current.type) : null;

  return (
    <div className="pb">
      <div className="pb-top">
        <div>
          <b>{title}</b>
          <span className="muted small">
            {path} {status === "live" ? "is live" : "is a draft"}
          </span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {state.done ? <span className="chip chip-mint">Saved</span> : null}
          {state.error ? <span className="chip chip-sun">{state.error}</span> : null}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => save(false)}
            disabled={saving}
          >
            Save as draft
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => save(true)}
            disabled={saving}
          >
            {saving ? "Saving" : "Publish"}
          </button>
        </div>
      </div>

      <div className="pb-body">
        {/* The canvas */}
        <div className="pb-canvas">
          <div className="app">
            <div className="pub">
              {blocks.length === 0 ? (
                <div className="pb-empty">
                  <p className="muted">This page has no blocks yet.</p>
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}>
                    Add the first block
                  </button>
                </div>
              ) : null}

              {blocks.map((b, i) => (
                <div
                  key={i}
                  className={`pb-block ${picked === i ? "on" : ""} ${over === i ? "over" : ""}`}
                  onClick={() => setPicked(i)}
                  draggable
                  onDragStart={() => setDragging(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(i);
                  }}
                  onDragLeave={() => setOver((o) => (o === i ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging != null) move(dragging, i);
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                >
                  <div className="pb-tools">
                    <span className="pb-grab" title="Drag to move">
                      <Ic name="move" />
                    </span>
                    <span className="pb-name">{blockLabel[b.type] ?? b.type}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); nudge(i, -1); }} title="Move up">
                      <Ic name="chevd" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); nudge(i, 1); }} title="Move down">
                      <Ic name="chevd" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); duplicate(i); }} title="Duplicate">
                      <Ic name="plus" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} title="Remove">
                      <Ic name="trash" />
                    </button>
                  </div>
                  <div className="pb-render">
                    <Blocks blocks={[b]} data={data} />
                  </div>
                  <button
                    type="button"
                    className="pb-insert"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdding(true);
                      setPicked(i);
                    }}
                    title="Add a block here"
                  >
                    <Ic name="plus" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What is selected */}
        <aside className="pb-side">
          {adding ? (
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 14 }}>Add a block</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
                  Close
                </button>
              </div>
              <div className="pb-palette">
                {BLOCKS.map((s) => (
                  <button
                    type="button"
                    key={s.type}
                    onClick={() => add(s.type, picked == null ? undefined : picked + 1)}
                  >
                    <b>{s.label}</b>
                    <span>{s.about}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : current && spec ? (
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: 14 }}>{spec.label}</h3>
                  <p className="muted small" style={{ marginTop: 2 }}>
                    {spec.about}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
                  Add a block
                </button>
              </div>

              <div className="stack" style={{ marginTop: 12 }}>
                {spec.fields.map((f) => (
                  <Field
                    key={f.name}
                    field={f}
                    value={current[f.name] ?? ""}
                    onChange={(v) => set(picked as number, f.name, v)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="panel panel-wash">
              <p className="muted small" style={{ margin: 0 }}>
                Click a block on the left to edit it, drag one to move it, or
                add a new one.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setAdding(true)}
              >
                Add a block
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: BlockField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.kind === "image")
    return (
      <Uploader
        name={`x_${field.name}`}
        label={field.label}
        hint={field.hint}
        current={value}
        onChange={onChange}
      />
    );

  if (field.kind === "long")
    return (
      <div className="field">
        <span>{field.label}</span>
        <RichText name={`x_${field.name}`} defaultValue={value} rows={4} onChange={onChange} />
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );

  if (field.kind === "select")
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
    );

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        type={field.kind === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.hint ? <span className="hint">{field.hint}</span> : null}
    </label>
  );
}
'@
Write-File "components\page-builder.tsx" $f0

$f1 = @'
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
  onChange,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  onChange?: (value: string) => void;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [value, setRaw] = useState(defaultValue);
  const setValue = (v: string) => {
    setRaw(v);
    onChange?.(v);
  };
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
Write-File "components\rich-text.tsx" $f1

$f2 = @'
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// One uploader for every image on the platform. It puts the file in the
// person's own folder, which is what the storage rules check, and hands
// the address back through a hidden field so the form saves it like any
// other value.
export function Uploader({
  name,
  bucket = "covers",
  folder,
  label,
  hint,
  current,
  shape = "wide",
  onChange,
}: {
  name: string;
  bucket?: "avatars" | "covers";
  folder?: string;
  label: string;
  hint?: string;
  current?: string | null;
  shape?: "wide" | "round";
  onChange?: (url: string) => void;
}) {
  const [url, setRaw] = useState<string | null>(current ?? null);
  const setUrl = (v: string | null) => {
    setRaw(v);
    onChange?.(v ?? "");
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are signed out.");

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${folder ? `${folder}/` : ""}${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError("That did not upload. Images only, and under five megabytes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      <input type="hidden" name={name} value={url ?? ""} />

      {url ? (
        <div className={`shot ${shape}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </div>
      ) : null}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        disabled={busy}
      />

      {busy ? <span className="hint">Uploading</span> : null}
      {error ? <span className="hint">{error}</span> : null}
      {hint && !error ? <span className="hint">{hint}</span> : null}
      {url ? (
        <button
          className="btn btn-ghost"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => setUrl(null)}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
'@
Write-File "components\uploader.tsx" $f2

$f3 = @'
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { PageBuilder } from "@/components/page-builder";
import { Ic } from "@/components/icon";
import type { Block } from "@/lib/blocks";

// The page builder. The rows every block might need are loaded here,
// so what the canvas shows is what the page will show.
export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: page }, { data: villages }, { data: counts }, { data: events }, { data: businesses }, { data: courses }, { data: articles }, { data: plans }] =
    await Promise.all([
      supabase
        .from("pages")
        .select("slug, title, path, blocks, search_title, search_description, status")
        .eq("slug", slug)
        .maybeSingle(),
      supabase
        .from("villages")
        .select("id, slug, name, city, country, status, summary, cover_url")
        .limit(8),
      supabase.from("village_public_counts").select("village_id, members, circles"),
      supabase
        .from("events")
        .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url, visibility")
        .eq("status", "published")
        .order("starts_at")
        .limit(6),
      supabase
        .from("businesses")
        .select("id, slug, name, category, summary, offer, logo_url")
        .eq("public", true)
        .limit(6),
      supabase
        .from("courses")
        .select("id, slug, title, level, format, price_cents, currency")
        .eq("status", "published")
        .limit(6),
      supabase
        .from("articles")
        .select("id, slug, title, standfirst, kind, cover_url")
        .eq("status", "published")
        .limit(6),
      supabase
        .from("plans")
        .select("slug, name, blurb, price_cents, currency, interval, features")
        .eq("active", true)
        .order("position"),
    ]);

  if (!page) notFound();

  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  return (
    <>
      <div className="crumbs">
        <Link href="/global/content">Pages</Link>
        <Ic name="chev" />
        <span>{page.title}</span>
      </div>

      <PageBuilder
        slug={page.slug}
        title={page.title}
        path={page.path}
        status={page.status}
        initial={(page.blocks ?? []) as Block[]}
        data={{
          villages: (villages ?? []).map((v) => ({ ...v, ...countFor(v.id) })),
          events: events ?? [],
          businesses: businesses ?? [],
          courses: courses ?? [],
          articles: articles ?? [],
          plans: plans ?? [],
        }}
      />
    </>
  );
}
'@
Write-File "app\global\content\[slug]\page.tsx" $f3

$f4 = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { record } from "@/lib/audit";
import { blockSpec, type Block } from "@/lib/blocks";

export type PageState = { error?: string; done?: string | boolean };

// The editor posts every block's fields at once, named block_0_heading and
// so on, so saving is one action rather than one per block.
function blocksFrom(formData: FormData): Block[] {
  const count = Number(formData.get("block_count") ?? 0);
  const rows: { pos: number; block: Block }[] = [];

  // Every block keeps whatever fields its type declares, so adding a
  // block type to the catalogue needs no change here.
  for (let i = 0; i < count; i += 1) {
    const type = String(formData.get(`block_${i}_type`) ?? "");
    if (!type || formData.get(`block_${i}_remove`)) continue;

    const spec = blockSpec(type);
    if (!spec) continue;

    const block: Block = { type };
    for (const f of spec.fields) {
      const v = String(formData.get(`block_${i}_${f.name}`) ?? "").trim();
      if (v) block[f.name] = v;
    }

    const pos = Number(formData.get(`block_${i}_pos`) ?? i + 1);
    rows.push({ pos: Number.isFinite(pos) ? pos : i + 1, block });
  }

  // The position boxes decide the order. Equal numbers keep the order
  // they were already in.
  const blocks = rows
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => a.pos - b.pos || a.i - b.i)
    .map((r) => r.block);

  return blocks;
}

export async function savePage(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const publish = String(formData.get("intent")) === "publish";

  const { error } = await supabase
    .from("pages")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      path: String(formData.get("path") ?? "").trim(),
      search_title: String(formData.get("search_title") ?? "").trim() || null,
      search_description:
        String(formData.get("search_description") ?? "").trim() || null,
      blocks: blocksFrom(formData),
      status: publish ? "live" : "draft",
      updated_by: admin.userId,
    })
    .eq("slug", slug);

  if (error) return { error: error.message };

  await record(admin.userId, publish ? "page.published" : "page.saved", "page", null, {
    slug,
  });

  revalidatePath("/global/content");
  revalidatePath("/");
  redirect(`/global/content/${slug}?done=${publish ? "published" : "saved"}`);
}

export async function addBlock(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const type = String(formData.get("type") ?? "text");

  const { data: page } = await supabase
    .from("pages")
    .select("blocks")
    .eq("slug", slug)
    .maybeSingle();

  const blocks = [...(((page?.blocks ?? []) as Block[]) || []), { type } as Block];

  const { error } = await supabase
    .from("pages")
    .update({ blocks, updated_by: admin.userId })
    .eq("slug", slug);

  if (error) return { error: error.message };

  revalidatePath(`/global/content/${slug}`);
  redirect(`/global/content/${slug}`);
}

export async function setPageStatus(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("pages")
    .update({ status, updated_by: admin.userId })
    .eq("slug", slug);

  if (error) return { error: error.message };

  await record(admin.userId, `page.${status}`, "page", null, { slug });

  revalidatePath("/global/content");
  revalidatePath("/");
  return { done: "saved" };
}


// The builder holds the blocks in the browser and sends the finished
// list, so there is no field naming to keep in step.
export async function saveBlocks({
  slug,
  blocks,
  status,
}: {
  slug: string;
  blocks: Block[];
  status: string;
}): Promise<PageState> {
  await requireGlobal();
  const supabase = await createClient();

  const clean = blocks
    .filter((b) => b && b.type && blockSpec(b.type))
    .map((b) => {
      const spec = blockSpec(b.type)!;
      const out: Block = { type: b.type };
      for (const f of spec.fields) {
        const v = String(b[f.name] ?? "").trim();
        if (v) out[f.name] = v;
      }
      return out;
    });

  const { error } = await supabase
    .from("pages")
    .update({
      blocks: clean,
      status: status === "live" ? "live" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) return { error: error.message };

  revalidatePath("/global/content");
  revalidatePath(`/global/content/${slug}`);
  revalidatePath("/", "layout");
  return { done: true };
}
'@
Write-File "app\global\content\actions.ts" $f4

$f5 = @'
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

/* ===== The block editor ===== */
.blockpos{width:58px;text-align:center;font:600 13px var(--body);color:var(--navy);
  border:1px solid #C7CDD4;border-radius:10px;padding:6px 8px;background:#fff}
.app .panel > .row > .row .check{border:0;box-shadow:none;padding:6px 8px}

/* ===== The page builder ===== */
.pb{display:flex;flex-direction:column;gap:14px}
.pb-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;
  padding:12px 16px;border:1px solid var(--line);border-radius:14px;background:#fff;
  position:sticky;top:calc(var(--barh,0px) + 56px);z-index:6;
  box-shadow:0 1px 3px rgba(15,20,25,.06),0 8px 20px rgba(15,20,25,.06)}
.pb-top b{display:block}
.pb-body{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px;align-items:start}
@media (max-width:1100px){.pb-body{grid-template-columns:1fr}}

.pb-canvas{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;
  box-shadow:0 1px 3px rgba(15,20,25,.06)}
.pb-canvas .pub{padding-bottom:20px}
.pb-empty{display:grid;place-items:center;gap:10px;padding:60px 20px;text-align:center}

.pb-block{position:relative;cursor:grab;border:2px solid transparent;border-radius:12px;margin:6px}
.pb-block:hover{border-color:#DCE3EA}
.pb-block.on{border-color:var(--blue)}
.pb-block.over{border-color:var(--mint);border-style:dashed}
.pb-block:active{cursor:grabbing}
.pb-render{pointer-events:none}
.pb-render .sec{padding-left:24px;padding-right:24px}

.pb-tools{position:absolute;top:-1px;right:8px;z-index:3;display:flex;align-items:center;gap:2px;
  padding:3px;border-radius:0 0 10px 10px;background:var(--ink);color:#fff;
  opacity:0;transition:opacity .12s}
.pb-block:hover .pb-tools,.pb-block.on .pb-tools{opacity:1}
.pb-tools .pb-name{font:600 11.5px var(--body);padding:0 8px;opacity:.85}
.pb-tools .pb-grab{display:grid;place-items:center;padding:4px 6px;cursor:grab}
.pb-tools button{border:0;background:transparent;color:#fff;border-radius:7px;padding:4px 6px;cursor:pointer;
  display:grid;place-items:center}
.pb-tools button:hover{background:rgba(255,255,255,.16)}
.pb-tools .ic{width:15px;height:15px}
.pb-tools button:nth-of-type(1) .ic{transform:rotate(180deg)}

.pb-insert{position:absolute;left:50%;bottom:-13px;transform:translateX(-50%);z-index:3;
  width:26px;height:26px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--ink);
  display:grid;place-items:center;cursor:pointer;opacity:0;transition:opacity .12s;
  box-shadow:0 2px 8px rgba(15,20,25,.16)}
.pb-block:hover .pb-insert{opacity:1}
.pb-insert .ic{width:14px;height:14px}

.pb-side{position:sticky;top:calc(var(--barh,0px) + 124px);display:grid;gap:12px}
.pb-palette{display:grid;gap:8px;margin-top:12px;max-height:60vh;overflow:auto}
.pb-palette button{text-align:left;border:1px solid var(--line);border-radius:12px;background:#fff;
  padding:10px 12px;cursor:pointer;display:grid;gap:2px}
.pb-palette button:hover{border-color:var(--blue);background:var(--wash)}
.pb-palette b{font-size:13.5px}
.pb-palette span{font-size:12px;color:var(--muted)}
'@
Write-File "app\forms.css" $f5

git add app components
git commit -m "A canvas with draggable blocks, not a form"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Nothing to run in Supabase."
    Write-Host "Global team, Content, Pages, Home."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
