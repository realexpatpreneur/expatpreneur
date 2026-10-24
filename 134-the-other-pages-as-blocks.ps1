# 134-the-other-pages-as-blocks.ps1
# Your three points. One migration: 0050_pages_as_blocks.sql.
#
# First, my fault. The Cookie policy was showing the member preview
# panel in its hero, with somebody's profile and a founders dinner on
# a legal page. I made the preview the default when a hero does not say
# what sits beside it, which was wrong: the preview is now shown only
# when a hero asks for it, and the home page asks for it.
#
# Then the empty pages. How it works, Membership, Terms and Privacy had
# no blocks, so the builder had nothing to show even though the pages
# themselves render. All four are written out now, section for section
# from the prototype:
#
#   How it works: the heading, the three nested layers, Industry Groups
#   and Pods, the three places things happen, the six step path from
#   invitation to your Circle, and the closing band.
#
#   Membership: the heading and its paragraph, the two plans priced
#   from the database, the note underneath, the nine questions, and the
#   panel of what is expected of members.
#
#   Privacy, Terms and Cookies: every heading and paragraph the
#   prototype has, as editable prose.
#
# All drafts. The coded pages keep rendering until each is published.
#
# And the panel folds. A button sits at the bottom right of the editor:
# press it and the canvas takes the full width, press it again and the
# panel comes back.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\components\blocks.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\page-builder.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\forms.css
#   C:\Users\HP\Desktop\expatpreneur\app\membership\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0050_pages_as_blocks.sql
#
#   powershell -ExecutionPolicy Bypass -File .\134-the-other-pages-as-blocks.ps1

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
import Link from "next/link";
import { pairs, type Block } from "@/lib/blocks";
import { toHtml } from "@/components/rich-text";
import { VillageCard, BusinessCard, CourseCard, ArticleCard, type BusinessRow } from "@/components/cards";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
import { HeroPreview } from "@/components/bits";
import { whenText } from "@/lib/events";

// Everything the block editor can make, drawn. Blocks that show live
// things are given the rows by the page, so one query serves the page
// however many blocks use it.
export type BlockData = {
  villages?: {
    slug: string; name: string; city: string; country: string;
    status: string; summary: string | null; cover_url?: string | null;
    members?: number | null; circles?: number | null;
  }[];
  events?: {
    id: string; slug: string; title: string; starts_at: string;
    ends_at?: string | null; timezone?: string; venue: string | null;
    cover_url?: string | null; visibility?: string;
  }[];
  businesses?: BusinessRow[];
  courses?: { id: string; slug: string; title: string; level?: string | null; format?: string | null; price_cents?: number | null; currency?: string | null; cover_url?: string | null }[];
  articles?: { id: string; slug: string; title: string; standfirst: string | null; kind?: string; cover_url?: string | null }[];
  plans?: { slug: string; name: string; blurb: string | null; price_cents: number; currency: string; interval: string; features: string[] }[];
};

const TONES: Record<string, string> = {
  wash: "panel-wash", navy: "band", blue: "band", pink: "ct-pink", mint: "ct-mint",
};

export function Blocks({ blocks, data = {} }: { blocks: Block[]; data?: BlockData }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Styled key={i} block={b}>
          <One block={b} data={data} />
        </Styled>
      ))}
    </>
  );
}

const SPACE: Record<string, string> = { tight: "18px 0", roomy: "72px 0", none: "0" };
const SIZE: Record<string, string> = { large: "1.25em", small: "0.85em" };

// The settings every block carries: width, spacing, colours, corners.
// A block with none of them set renders exactly as it did before.
function Styled({ block: b, children }: { block: Block; children: React.ReactNode }) {
  const bg = b.bg === "custom" ? b.bg_custom : b.bg;
  const ink = b.ink === "custom" ? b.ink_custom : b.ink;

  const style: React.CSSProperties = {};
  if (bg) style.background = bg;
  if (ink) style.color = ink;
  if (b.space) style.padding = SPACE[b.space];
  if (b.round === "soft") style.borderRadius = 18;
  if (b.align === "center") style.textAlign = "center";
  if (b.size) style.fontSize = SIZE[b.size];

  const inner: React.CSSProperties =
    b.width === "narrow"
      ? { maxWidth: 720, marginLeft: "auto", marginRight: "auto" }
      : b.width === "wide"
        ? { maxWidth: "none" }
        : {};

  const plain = !bg && !ink && !b.space && !b.round && !b.align && !b.size && !b.width;
  if (plain) return <>{children}</>;

  return (
    <div className={`blk ${ink ? "blk-ink" : ""}`} style={style}>
      <div style={inner}>{children}</div>
    </div>
  );
}

function SecHead({ heading, href }: { heading?: string; href?: string }) {
  if (!heading) return null;
  return (
    <div className="sechead">
      <h2 style={{ fontSize: 20 }}>{heading}</h2>
      {href ? (
        <Link className="small" style={{ fontWeight: 600 }} href={href}>
          See all
        </Link>
      ) : null}
    </div>
  );
}

function One({ block: b, data }: { block: Block; data: BlockData }) {
  switch (b.type) {
    case "hero": {
      const art =
        b.art === "image" && b.image_url ? (
          <div
            className="photo"
            role="img"
            aria-label={b.heading ?? ""}
            style={{ height: 420, backgroundImage: `url('${b.image_url}')` }}
          />
        ) : b.art === "preview" ? (
          <HeroPreview />
        ) : null;

      const words = (
        <>
          <h1>{b.heading}</h1>
          {b.text ? <p className="lead">{b.text}</p> : null}
          {b.button_label || b.second_label ? (
            <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
              {b.button_label ? (
                <Link className="btn btn-primary" href={b.button_href ?? "/apply"}>
                  {b.button_label}
                </Link>
              ) : null}
              {b.second_label ? (
                <Link className="btn btn-ghost" href={b.second_href ?? "/discover"}>
                  {b.second_label}
                </Link>
              ) : null}
            </div>
          ) : null}
          {b.quote ? <p className="proverb">{b.quote}</p> : null}
        </>
      );

      // Centred means the words alone; otherwise the words sit beside
      // whatever was chosen for the right.
      if (b.layout === "center" || !art)
        return <section className="sec hero-center">{words}</section>;

      return (
        <section className="hero" style={{ padding: "48px 0" }}>
          <div>{words}</div>
          <div className="art">{art}</div>
        </section>
      );
    }

    case "heading":
      return (
        <section className="sec">
          <h2 style={{ fontSize: 20 }}>{b.heading}</h2>
          {b.text ? <p className="intro">{b.text}</p> : null}
        </section>
      );

    case "text":
      return (
        <section className="sec">
          <div
            className={b.width === "narrow" ? "article" : ""}
            dangerouslySetInnerHTML={{ __html: toHtml(b.body ?? "") }}
          />
        </section>
      );

    case "panel":
      return (
        <section className="sec">
          <div className={`panel ${b.tone === "wash" ? "panel-wash" : ""}`}>
            {b.heading ? <h3 style={{ fontSize: 15 }}>{b.heading}</h3> : null}
            {b.body ? (
              <div dangerouslySetInnerHTML={{ __html: toHtml(b.body) }} />
            ) : null}
            {b.button_label ? (
              <Link className="btn btn-ghost btn-sm" href={b.button_href ?? "/"}>
                {b.button_label}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case "band":
      return (
        <section className="sec">
          <div className={`band ${TONES[b.tone ?? ""] ?? ""}`}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 22 }}>{b.heading}</h2>
              {b.text ? <p style={{ marginTop: 6 }}>{b.text}</p> : null}
            </div>
            {b.button_label ? (
              <Link className="btn btn-mint" href={b.button_href ?? "/apply"}>
                {b.button_label}
              </Link>
            ) : null}
            {b.second_label ? (
              <Link className="btn btn-ghost" href={b.second_href ?? "/discover"}>
                {b.second_label}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case "image":
      return (
        <section className="sec">
          <div
            className="photo"
            role="img"
            aria-label={b.caption ?? ""}
            style={{ height: Number(b.height) || 320, backgroundImage: `url('${b.image_url ?? ""}')` }}
          />
          {b.caption ? (
            <p className="muted small" style={{ marginTop: 8 }}>
              {b.caption}
            </p>
          ) : null}
        </section>
      );

    case "stats": {
      const cells = [1, 2, 3, 4]
        .map((n) => [b[`label_${n}`], b[`value_${n}`]] as [string | undefined, string | undefined])
        .filter(([label]) => label);
      if (!cells.length) return null;
      return (
        <section className="sec">
          <div className={`g3 ${cells.length === 4 ? "g4" : ""} stats3`}>
            {cells.map(([label, value]) => (
              <div className="stat" key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "steps":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <ol className="jpath" style={{ marginTop: 18 }}>
            {pairs(b.items).map(([title, text], n) => (
              <li className="jp-step" key={title} style={{ ["--i" as string]: n }}>
                <span className="jp-num">{n + 1}</span>
                <div className="jp-body">
                  <h3>{title}</h3>
                  {text ? <p>{text}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case "features":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className={`g3 ${b.columns === "4" ? "g4" : ""}`} style={{ marginTop: 14 }}>
            {pairs(b.items).map(([title, text]) => (
              <div className="panel" key={title}>
                <h3 style={{ fontSize: 14 }}>{title}</h3>
                {text ? (
                  <p className="muted small" style={{ marginTop: 4 }}>
                    {text}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className="faq" style={{ marginTop: 10 }}>
            {pairs(b.items).map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case "quotes":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className="quotes" style={{ marginTop: 14 }}>
            {pairs(b.items).map(([quote, who]) => (
              <figure className="quote" key={quote}>
                <blockquote>{quote}</blockquote>
                <figcaption>
                  <b>{who}</b>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );

    case "layers": {
      const items = pairs(b.items);
      const swatch = ["var(--mint)", "var(--blue)", "var(--navy)"];
      return (
        <section className="sec">
          {b.heading ? <h2>{b.heading}</h2> : null}
          {b.text ? <p className="intro">{b.text}</p> : null}
          <div className="layers layers-tint">
            {items.map(([name, text], n) => (
              <div className="layer" key={name}>
                <span className="swatch" style={{ background: swatch[n % 3] }} />
                <h3>{name}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "villages": {
      const list = (data.villages ?? []).filter((v) =>
        b.show === "open" ? v.status === "open" : b.show === "soon" ? v.status !== "open" : true
      );
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((v) => (
              <VillageCard key={v.slug} village={v} />
            ))}
          </div>
        </section>
      );
    }

    case "events": {
      let list = data.events ?? [];
      if (b.scope === "public") list = list.filter((e) => e.visibility === "public");
      list = list.slice(0, Number(b.limit) || 4);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="divide">
            {list.map((e) => {
              const d = new Date(e.starts_at);
              return (
                <EventRow
                  key={e.id}
                  cover={e.cover_url}
                  href={`/e/${e.slug}`}
                  day={String(d.getDate())}
                  month={d.toLocaleDateString("en-GB", { month: "short" })}
                  title={e.title}
                  line={`${whenText({
                    starts_at: e.starts_at,
                    ends_at: e.ends_at ?? null,
                    timezone: e.timezone ?? "UTC",
                  })}${e.venue ? `, ${e.venue}` : ""}`}
                />
              );
            })}
          </div>
        </section>
      );
    }

    case "businesses": {
      const list = (data.businesses ?? []).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((x, n) => (
              <BusinessCard key={x.slug} biz={x} i={n} />
            ))}
          </div>
        </section>
      );
    }

    case "courses": {
      const list = (data.courses ?? []).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((c, n) => (
              <CourseCard key={c.slug} course={c} i={n} />
            ))}
          </div>
        </section>
      );
    }

    case "articles": {
      const list = (data.articles ?? []).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((a, n) => (
              <ArticleCard key={a.slug} article={a} i={n} />
            ))}
          </div>
        </section>
      );
    }

    case "story":
      return (
        <section className="sec">
          <div className="story">
            <div
              className="img"
              role="img"
              aria-label={b.heading ?? ""}
              style={b.image_url ? { backgroundImage: `url('${b.image_url}')` } : undefined}
            />
            <div>
              <h3 style={{ fontSize: 20, maxWidth: "28ch" }}>{b.heading}</h3>
              {b.body ? (
                <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
                  {b.body}
                </p>
              ) : null}
              {b.button_href ? (
                <Link className="btn btn-ghost btn-sm" href={b.button_href}>
                  Read the story
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      );

    case "plans": {
      const list = data.plans ?? [];
      if (!list.length) return null;
      return (
        <section className="sec memsec">
          {b.heading ? <h2>{b.heading}</h2> : null}
          {b.text ? <p className="intro">{b.text}</p> : null}
          <div className="plans">
            {list.map((p, n) => (
              <div className={`plan2 ${n === list.length - 1 ? "p2-best" : ""}`} key={p.slug}>
                <div className="p2-top">
                  <h3>{p.name}</h3>
                  <span className="p2-tag">{p.blurb}</span>
                </div>
                <div className="p2-price">
                  <b>
                    {p.price_cents
                      ? `${(p.price_cents / 100).toFixed(0)} ${p.currency}`
                      : "By application"}
                  </b>
                  <span>{p.price_cents ? `per ${p.interval}` : "Every request is read personally"}</span>
                </div>
                <ul className="p2-list">
                  {(p.features ?? []).map((f) => (
                    <li key={f}>
                      <Ic name="check" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
'@
Write-File "components\blocks.tsx" $f0

$f1 = @'
"use client";

import { useState } from "react";
import {
  BLOCKS,
  COLOURS,
  SITE_LINKS,
  STYLE_FIELDS,
  blockLabel,
  blockSpec,
  type Block,
  type BlockField,
} from "@/lib/blocks";
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
  const [tab, setTab] = useState<"content" | "style">("content");
  const [shut, setShut] = useState(false);
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

      <div className={`pb-body ${shut ? "wide" : ""}`}>
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

        {/* What is selected. It folds away so the canvas has the room. */}
        <button
          type="button"
          className="pb-fold"
          onClick={() => setShut(!shut)}
          title={shut ? "Show the panel" : "Hide the panel"}
        >
          <Ic name="chev" />
          <span>{shut ? "Edit" : "Hide"}</span>
        </button>

        <aside className="pb-side" hidden={shut}>
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

              <div className="pb-tabs">
                <button
                  type="button"
                  className={tab === "content" ? "on" : ""}
                  onClick={() => setTab("content")}
                >
                  Content
                </button>
                <button
                  type="button"
                  className={tab === "style" ? "on" : ""}
                  onClick={() => setTab("style")}
                >
                  Style
                </button>
              </div>

              <div className="stack pb-fields">
                {spec.fields
                  .filter((f) =>
                    tab === "style"
                      ? STYLE_FIELDS.some((x) => x.name === f.name)
                      : !STYLE_FIELDS.some((x) => x.name === f.name)
                  )
                  .map((f) => (
                    <Field
                      key={f.name}
                      field={f}
                      value={current[f.name] ?? ""}
                      custom={current[`${f.name}_custom`] ?? ""}
                      onChange={(v) => set(picked as number, f.name, v)}
                      onCustom={(v) => set(picked as number, `${f.name}_custom`, v)}
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
  custom = "",
  onChange,
  onCustom,
}: {
  field: BlockField;
  value: string;
  custom?: string;
  onChange: (v: string) => void;
  onCustom?: (v: string) => void;
}) {
  if (field.kind === "image")
    return (
      <div className="field">
        <Uploader
          name={`x_${field.name}`}
          label={field.label}
          hint={field.hint}
          current={value}
          onChange={onChange}
        />
        <input
          style={{ marginTop: 8 }}
          value={value}
          placeholder="Or paste the address of a picture"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );

  if (field.kind === "colour") {
    const picked = value === "custom";
    return (
      <div className="field">
        <span>{field.label}</span>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {COLOURS.map(([v, t]) =>
            v === "custom" ? null : (
              <button
                type="button"
                key={v || "none"}
                className={`pb-swatch ${value === v ? "on" : ""} ${v ? "" : "none"}`}
                style={v ? { background: v } : undefined}
                title={t}
                onClick={() => onChange(v)}
              />
            )
          )}
          <button
            type="button"
            className={`pb-swatch own ${picked ? "on" : ""}`}
            title="A colour of my own"
            style={picked && custom ? { background: custom } : undefined}
            onClick={() => onChange("custom")}
          >
            +
          </button>
        </div>
        {picked ? (
          <input
            type="color"
            style={{ marginTop: 8, height: 40, padding: 4 }}
            value={custom || "#2C3E50"}
            onChange={(e) => onCustom?.(e.target.value)}
          />
        ) : null}
      </div>
    );
  }

  if (field.kind === "link") {
    const known = SITE_LINKS.some(([v]) => v === value);
    return (
      <div className="field">
        <span>{field.label}</span>
        <select
          value={known ? value : "custom"}
          onChange={(e) => onChange(e.target.value === "custom" ? "" : e.target.value)}
        >
          {SITE_LINKS.map(([v, t]) => (
            <option key={v || "none"} value={v}>
              {t}
            </option>
          ))}
        </select>
        {!known || value === "custom" ? (
          <input
            style={{ marginTop: 8 }}
            value={value === "custom" ? "" : value}
            placeholder="https:// or /somewhere"
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );
  }

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
Write-File "components\page-builder.tsx" $f1

$f2 = @'
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

/* The inspector: it scrolls, and it has two tabs */
.pb-side{max-height:calc(100vh - var(--barh,0px) - 150px);overflow:auto;padding-right:2px}
.pb-fields{margin-top:12px}
.pb-tabs{display:flex;gap:4px;margin-top:12px;padding:4px;border-radius:999px;background:rgba(15,20,25,.05)}
.pb-tabs button{flex:1;border:0;background:transparent;border-radius:999px;padding:7px 12px;
  font:600 12.5px var(--body);color:var(--muted);cursor:pointer}
.pb-tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(15,20,25,.12)}

.pb-swatch{width:28px;height:28px;border-radius:9px;border:1px solid rgba(15,20,25,.15);cursor:pointer;
  padding:0;display:grid;place-items:center;font:700 13px var(--body);color:#5A6875;background:#fff}
.pb-swatch.on{box-shadow:0 0 0 2px var(--ink)}
.pb-swatch.none{background:repeating-linear-gradient(45deg,#fff 0 6px,#EDF0F3 6px 12px)}
.pb-swatch.own{background:linear-gradient(135deg,#F2A65A,#4074AE,#A8DCD1)}

/* A block that has been given a colour keeps its text readable */
.blk-ink h1,.blk-ink h2,.blk-ink h3,.blk-ink p,.blk-ink b{color:inherit}
.blk{padding:0 var(--gx,0)}

/* The panel folds away when the canvas needs the room */
.pb-body.wide{grid-template-columns:minmax(0,1fr)}
.pb-fold{position:fixed;right:18px;bottom:18px;z-index:20;display:inline-flex;align-items:center;gap:6px;
  border:1px solid var(--line);background:var(--ink);color:#fff;border-radius:999px;padding:9px 14px;
  font:600 12.5px var(--body);cursor:pointer;box-shadow:0 8px 20px rgba(15,20,25,.25)}
.pb-fold .ic{width:15px;height:15px}
.pb-body.wide .pb-fold .ic{transform:rotate(180deg)}
'@
Write-File "app\forms.css" $f2

$f3 = @'
import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { Plans, type Plan } from "@/components/plans";
import { Ic } from "@/components/icon";

export const metadata = {
  title: "Membership, ExpatPreneurs Global",
  description:
    "Membership is by invitation and costs nothing. The paid plan opens the rest of the network.",
};

const QUESTIONS: [string, string][] = [
  ["Why is membership by invitation?", "So every Village stays trusted and useful. Every request is read personally."],
  ["Does membership cost anything?", "Membership in your own Village comes with your invitation and costs nothing. One paid plan, Paid member, adds every Village."],
  ["I am already in the Dubai WhatsApp group. Do I pay?", "No. Re-enrol on the platform and your place stays, with a founding member badge. The paid plan is optional, for reaching every Village."],
  ["Who can request an invitation?", "Anyone building a business in a country that is not their country of origin, from the idea stage to expansion."],
  ["Why do you ask about my nationalities and the countries I have lived in?", "They make up your expat journey on your profile, so members can find people who know a market or speak a language."],
  ["Is ExpatPreneurs a place to sell?", "Members share their work in the right places, but relationships come first. Mass pitching is not allowed."],
  ["What if I move to another city?", "Your profile and history stay with you. You can ask to transfer to the Village in your new city."],
  ["Is this a dating space?", "No. It is a professional community built on warm, respectful connection."],
  ["Can I change membership later?", "Yes. You can upgrade or cancel from your settings at any time."],
];

const EXPECTED = [
  "Human before transaction",
  "Collaboration over competition",
  "Contribute as well as receive",
  "Respect professional boundaries",
  "Help keep the Village international",
];

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, slug, name, blurb, price_cents, currency, interval, features")
    .eq("active", true)
    .order("position");

  // A published page replaces what is written below.
  const page = await livePage("membership");

  if (page) {
    return (
      <PublicPage active="/membership">
        <Blocks blocks={page.blocks} data={{ plans: plans ?? [] }} />
      </PublicPage>
    );
  }

  return (
    <PublicPage active="/membership">
      <section className="pubsec memsec">
        <h2>Membership</h2>
        <p className="intro">
          ExpatPreneurs is for anyone building a business in a country that is
          not their country of origin, at any stage: an idea, a growing
          business or an expansion. Membership is by invitation, for people who
          want to contribute as well as receive.
        </p>
        <Plans plans={(plans ?? []) as Plan[]} />
        <p className="muted small plans-note">
          Membership is by invitation. Once your request is accepted you can
          upgrade to the paid plan at any time.
        </p>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="gside">
          <div className="faqcol">
            <h2 style={{ fontSize: 22 }}>Questions</h2>
            <div className="faq" style={{ marginTop: 10 }}>
              {QUESTIONS.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="panel panel-wash">
            <h3 style={{ fontSize: 15 }}>What we expect from members</h3>
            <ul className="ticks" style={{ marginTop: 10 }}>
              {EXPECTED.map((x) => (
                <li key={x}>
                  <Ic name="check" />
                  {x}
                </li>
              ))}
            </ul>
            <Link className="btn btn-ghost btn-sm" href="/legal/terms">
              Read our terms
            </Link>
          </aside>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\membership\page.tsx" $f3

$f4 = @'
-- How it works, Membership and the three legal pages, as blocks.
--
-- Each one is the prototype's page, section by section and in its own
-- words: the nested layers and the six step path on How it works, the
-- two plans and the nine questions on Membership, and every heading
-- and paragraph of Privacy, Terms and Cookies.
--
-- All saved as drafts. The coded pages keep rendering until each is
-- published from Global team, Content, Pages.


update pages set blocks = '[
 {
  "type": "heading",
  "heading": "How ExpatPreneurs works",
  "text": "Local community gives you belonging. The global network gives you continuity, reach and access. You get both."
 },
 {
  "type": "layers",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "features",
  "columns": "2",
  "items": "Industry Groups | Stable groups by profession, such as Creative & Design or Hospitality. They connect you with people in your field across Circles and, over time, across Villages.\nPods | Small groups of about six members working toward a shared goal, such as accountability or entering a new market. Pods have a lead, a rhythm and an end date."
 },
 {
  "type": "features",
  "heading": "Where things happen",
  "columns": "3",
  "items": "Daily conversation on WhatsApp | Each Circle, Industry Group and Pod has its own private WhatsApp group.\nEverything else on the platform | Your profile, the Directory, Ask & Offer, events, businesses and learning.\nIn person every month | Each Village holds at least one meaningful gathering a month."
 },
 {
  "type": "steps",
  "heading": "From invitation to your Circle",
  "items": "Request an invitation | Tell us about you, your business and your expat journey.\nReview | Every request is read personally.\nWelcome | Once accepted, complete your profile and choose what the public can see.\nJoin your Circle | You are placed in a Circle and added to its WhatsApp group.\nTake part | Ask, offer, meet and explore other Villages.\nMove with you | If you change city, your profile and history come with you."
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "See membership",
  "second_href": "/membership"
 }
]'::jsonb, updated_at = now()
where slug = 'how';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Membership",
  "text": "ExpatPreneurs is for anyone building a business in a country that is not their country of origin, at any stage: an idea, a growing business or an expansion. Membership is by invitation, for people who want to contribute as well as receive."
 },
 {
  "type": "plans"
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "Membership is by invitation. Once your request is accepted you can upgrade to the paid plan at any time."
 },
 {
  "type": "faq",
  "heading": "Questions",
  "items": "Why is membership by invitation? | So every Village stays trusted and useful. Every request is read personally.\nDoes membership cost anything? | Membership in your own Village comes with your invitation and costs nothing. One paid plan, Paid member, adds every Village at 50 EUR a month or 500 EUR a year.\nI am already in the Dubai WhatsApp group. Do I pay? | No. Re-enrol on the platform and your place stays, with a founding member badge. The paid plan is optional, for reaching every Village.\nWho can request an invitation? | Anyone building a business in a country that is not their country of origin, from the idea stage to expansion.\nWhy do you ask about my nationalities and the countries I have lived in? | They make up your expat journey on your profile, so members can find people who know a market or speak a language.\nIs ExpatPreneurs a place to sell? | Members share their work in the right places, but relationships come first. Mass pitching is not allowed.\nWhat if I move to another city? | Your profile and history stay with you. You can ask to transfer to the Village in your new city.\nIs this a dating space? | No. It is a professional community built on warm, respectful connection.\nCan I change membership later? | Yes. You can upgrade or cancel from your settings at any time."
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "What we expect from members",
  "body": "- Human before transaction\n- Collaboration over competition\n- Contribute as well as receive\n- Respect professional boundaries\n- Help keep the Village international",
  "button_label": "Read our terms",
  "button_href": "/legal/terms"
 }
]'::jsonb, updated_at = now()
where slug = 'membership';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Terms of membership",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## Membership\nMembership is by invitation and personal. It cannot be transferred.\n## Conduct\nMembers follow the community values. Harassment, discrimination and aggressive selling are not allowed.\n## Paid membership\nThe paid plan is 50 EUR a month or 500 EUR a year. It renews until you cancel, and you can cancel at any time from your settings.\n## Event tickets\nSome events have a small ticket to confirm your seat. The refund policy is shown when you book.\n## Marketplaces\nBusiness contact happens directly between members and customers."
 }
]'::jsonb, updated_at = now()
where slug = 'terms';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Privacy policy",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## What we collect\nYour account, profile, invitation request and membership details, and how you use the platform.\n## Your public profile\nYour business, offers, expat journey, nationalities and languages are public if you agree when you join. What you are looking for stays visible to members only.\n## Contact details\nYour email and phone number are never public.\n## Your rights\nYou can export or delete your data from your settings."
 }
]'::jsonb, updated_at = now()
where slug = 'privacy';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Cookie policy",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## Essential cookies\nKeep you logged in and the platform secure.\n## Analytics\nHelp us understand what is useful. You can switch these off."
 }
]'::jsonb, updated_at = now()
where slug = 'cookies';
'@
Write-File "supabase\migrations\0050_pages_as_blocks.sql" $f4

git add app components supabase
git commit -m "Four more pages as blocks, the hero preview only where asked for, a folding panel"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0050_pages_as_blocks.sql"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
