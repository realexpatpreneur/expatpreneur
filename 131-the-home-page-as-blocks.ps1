# 131-the-home-page-as-blocks.ps1
# The home page written out as blocks, section for section. One
# migration: 0049_home_page_blocks.sql.
#
# Eight blocks, in the prototype's order, with the prototype's words:
#
#   the hero, with both buttons and the proverb in the margin
#   the three layers, Global, Village and Circle, as one joined strip
#   the mint strip about Industry Groups and Pods
#   the four cards under "What members do here"
#   the Villages, from the database
#   the founder story in the pink panel
#   three businesses, from the database
#   the closing blue band with both buttons
#
# Two block types were added so nothing had to be approximated: the
# three layer strip, and the margin line under the hero.
#
# It is saved as a draft. The coded home page keeps rendering until
# somebody presses Publish, so you can put the two side by side and
# only switch when they match. Once it is published, every one of those
# eight sections can be reworded, reordered, removed or added to from
# the Pages editor, and the coded home page can go.
#
# Next: How it works, then Membership, then the Villages index, in the
# same way.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\lib\blocks.ts
#   C:\Users\HP\Desktop\expatpreneur\components\blocks.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0049_home_page_blocks.sql
#
#   powershell -ExecutionPolicy Bypass -File .\131-the-home-page-as-blocks.ps1

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
// The block catalogue.
//
// A page is a list of blocks. Every section the site uses is a block
// type here, with the fields the Global team fills in, so a page can be
// rearranged, added to or rebuilt without a developer. Blocks that show
// live things, such as Villages or events, take settings rather than
// content, and read the database when the page is drawn.

export type FieldKind = "text" | "long" | "url" | "image" | "select" | "number";

export type BlockField = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: [string, string][];
  hint?: string;
};

export type BlockSpec = {
  type: string;
  label: string;
  about: string;
  fields: BlockField[];
};

const T = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "text", hint });
const L = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "long", hint });
const U = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "url", hint });
const I = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "image", hint });
const S = (name: string, label: string, options: [string, string][], hint?: string): BlockField =>
  ({ name, label, kind: "select", options, hint });
const N = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "number", hint });

const WIDTH: [string, string][] = [
  ["", "Normal"],
  ["wide", "Full width"],
  ["narrow", "Narrow, for reading"],
];
const TONE: [string, string][] = [
  ["", "White"],
  ["wash", "Pale grey"],
  ["navy", "Navy"],
  ["blue", "Blue"],
  ["pink", "Pink"],
  ["mint", "Mint"],
];

export const BLOCKS: BlockSpec[] = [
  {
    type: "hero",
    label: "Hero",
    about: "The top of a page: a heading, a paragraph and up to two buttons.",
    fields: [
      T("heading", "Heading"),
      L("text", "Paragraph"),
      T("button_label", "Button"),
      U("button_href", "Button goes to"),
      T("second_label", "Second button"),
      U("second_href", "Second button goes to"),
      I("image_url", "Photograph", "Leave empty for the built-in preview panel."),
      L("quote", "Line in the margin", "The bordered line under the buttons."),
      S("align", "Layout", [["", "Text left, picture right"], ["center", "Centred"]]),
    ],
  },
  {
    type: "heading",
    label: "Heading",
    about: "A section heading, with an optional line underneath.",
    fields: [T("heading", "Heading"), L("text", "Line underneath")],
  },
  {
    type: "text",
    label: "Text",
    about: "A paragraph or several. Headings, lists and links are allowed.",
    fields: [L("body", "Text"), S("width", "Width", WIDTH)],
  },
  {
    type: "panel",
    label: "Panel",
    about: "A bordered box with a heading, some text and a button.",
    fields: [
      T("heading", "Heading"),
      L("body", "Text"),
      T("button_label", "Button"),
      U("button_href", "Button goes to"),
      S("tone", "Background", TONE),
    ],
  },
  {
    type: "band",
    label: "Band",
    about: "The wide coloured strip with a heading and a button.",
    fields: [
      T("heading", "Heading"),
      L("text", "Line underneath"),
      T("button_label", "Button"),
      U("button_href", "Button goes to"),
      T("second_label", "Second button"),
      U("second_href", "Second button goes to"),
      S("tone", "Colour", TONE),
    ],
  },
  {
    type: "image",
    label: "Photograph",
    about: "One photograph across the page.",
    fields: [I("image_url", "Photograph"), T("caption", "Caption"), N("height", "Height in pixels")],
  },
  {
    type: "stats",
    label: "Numbers",
    about: "Up to four figures side by side. Leave a figure empty to count it from the database.",
    fields: [
      T("label_1", "First label"), T("value_1", "First figure"),
      T("label_2", "Second label"), T("value_2", "Second figure"),
      T("label_3", "Third label"), T("value_3", "Third figure"),
      T("label_4", "Fourth label"), T("value_4", "Fourth figure"),
    ],
  },
  {
    type: "steps",
    label: "Steps",
    about: "A numbered path, as on How it works. One step per line, heading and text separated by a bar.",
    fields: [
      T("heading", "Heading"),
      L("items", "Steps", "One per line, for example: Apply | Tell us about your business"),
    ],
  },
  {
    type: "features",
    label: "Cards",
    about: "Three or four small cards. One per line: heading, then text, separated by a bar.",
    fields: [
      T("heading", "Heading"),
      L("items", "Cards", "One per line, for example: Ask and offer | Post what you need"),
      S("columns", "Across", [["3", "Three"], ["4", "Four"], ["2", "Two"]]),
    ],
  },
  {
    type: "faq",
    label: "Questions",
    about: "A list of questions that open. One per line, question and answer separated by a bar.",
    fields: [T("heading", "Heading"), L("items", "Questions")],
  },
  {
    type: "quotes",
    label: "Quotes",
    about: "What members say. One per line: the quote, then who said it, separated by a bar.",
    fields: [T("heading", "Heading"), L("items", "Quotes")],
  },
  {
    type: "layers",
    label: "The three layers",
    about: "Global, Village and Circle, joined as one strip.",
    fields: [
      T("heading", "Heading"),
      L("text", "Line underneath"),
      L("items", "The layers", "One per line: name | what it is"),
    ],
  },
  {
    type: "villages",
    label: "Villages",
    about: "The Village cards, from the database.",
    fields: [
      T("heading", "Heading"),
      S("show", "Which Villages", [["", "All"], ["open", "Open only"], ["soon", "Launching soon"]]),
      U("more_href", "See all goes to"),
    ],
  },
  {
    type: "events",
    label: "Events",
    about: "Upcoming events, from the database.",
    fields: [
      T("heading", "Heading"),
      S("scope", "Which events", [["", "Every Village"], ["public", "Open to everyone"]]),
      N("limit", "How many"),
      U("more_href", "See all goes to"),
    ],
  },
  {
    type: "businesses",
    label: "Businesses",
    about: "Member businesses, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), U("more_href", "See all goes to")],
  },
  {
    type: "courses",
    label: "Learning",
    about: "Courses, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), U("more_href", "See all goes to")],
  },
  {
    type: "articles",
    label: "Stories",
    about: "Published articles, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), U("more_href", "See all goes to")],
  },
  {
    type: "story",
    label: "Featured story",
    about: "One story in the pink panel, as on the home page.",
    fields: [T("heading", "Heading"), L("body", "Text"), I("image_url", "Photograph"), U("button_href", "Read it goes to")],
  },
  {
    type: "plans",
    label: "Plans",
    about: "The membership cards, priced from the database.",
    fields: [T("heading", "Heading"), L("text", "Line underneath")],
  },
];

export const blockSpec = (type: string) => BLOCKS.find((b) => b.type === type);
export const blockLabel: Record<string, string> = Object.fromEntries(
  BLOCKS.map((b) => [b.type, b.label])
);

// A block is its type plus whatever its fields hold.
export type Block = { type: string } & Record<string, string | undefined>;

// "Heading | text" on each line, which is how the list fields are written.
export function pairs(value?: string): [string, string][] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|");
      return i < 0 ? ([l, ""] as [string, string]) : ([l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string]);
    });
}
'@
Write-File "lib\blocks.ts" $f0

$f1 = @'
import Link from "next/link";
import { pairs, type Block } from "@/lib/blocks";
import { toHtml } from "@/components/rich-text";
import { VillageCard, BusinessCard, CourseCard, ArticleCard, type BusinessRow } from "@/components/cards";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
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
        <One key={i} block={b} data={data} />
      ))}
    </>
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
    case "hero":
      return (
        <section className={`sec ${b.align === "center" ? "hero-center" : ""}`}>
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
          {b.image_url ? (
            <div
              className="photo"
              role="img"
              aria-label={b.heading ?? ""}
              style={{ height: 320, marginTop: 20, backgroundImage: `url('${b.image_url}')` }}
            />
          ) : null}
        </section>
      );

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
Write-File "components\blocks.tsx" $f1

$f2 = @'
import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { HeroPreview, LayerCards } from "@/components/bits";
import { VillageCard, BusinessCard, type BusinessRow } from "@/components/cards";
import { Ic } from "@/components/icon";

// The home page, block for block as the prototype lays it out.
export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: villages },
    { data: counts },
    { data: businesses },
    { data: events },
    { data: articles },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
    supabase.from("village_public_counts").select("village_id, members, circles"),
    supabase
      .from("businesses")
      .select("id, slug, name, category, summary, offer, logo_url")
      .eq("public", true)
      .limit(3),
    // A published home page can hold any block, so the rows every block
    // might want are loaded once here.
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url, visibility")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(6),
    supabase
      .from("articles")
      .select("id, slug, title, standfirst, kind, cover_url")
      .eq("status", "published")
      .eq("member_only", false)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("plans")
      .select("slug, name, blurb, price_cents, currency, interval, features")
      .eq("active", true)
      .order("position"),
  ]);

  // Open Villages first, then the ones launching, then the ones being explored.
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const ordered = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }));

  // A published page replaces what is written below. A draft leaves it be.
  const page = await livePage("home");

  if (page) {
    return (
      <PublicPage>
        <Blocks
          blocks={page.blocks}
          data={{
            villages: ordered,
            businesses: businesses ?? [],
            events: events ?? [],
            articles: articles ?? [],
            plans: plans ?? [],
          }}
        />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <section className="hero">
        <div>
          <h1>Your business needs a village too.</h1>
          <p className="lead">
            A curated network of expat entrepreneurs. Belong to a small, trusted
            community in your city, and reach people you can trust in other
            markets.
          </p>
          <div className="ctas">
            <Link className="btn btn-primary" href="/apply">
              Request your invitation
            </Link>
            <Link className="btn btn-ghost" href="/villages">
              Find your Village
            </Link>
          </div>
          <p className="proverb">
            &ldquo;It takes a village to raise a child.&rdquo; We believe the
            same is true of the businesses we build far from home.
          </p>
        </div>
        <div className="art">
          <HeroPreview />
        </div>
      </section>

      <section className="pubsec">
        <h2>Big enough to open doors. Small enough to know each other.</h2>
        <p className="intro">
          Every member belongs to three places at once. As the network grows,
          your home base stays human sized.
        </p>
        <LayerCards />
        <div className="across">
          <Ic name="users" style={{ color: "#24675A" }} />
          <p style={{ flex: 1, minWidth: 220 }}>
            <b>Across all three:</b> Industry Groups connect you with people in
            your field, and Pods bring a few members together around a shared
            goal.
          </p>
          <Link className="btn btn-ghost btn-sm" href="/how-it-works">
            How it works
          </Link>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>What members do here</h2>
        </div>
        <div className="g4 g3">
          {(
            [
              ["hand", "Ask and offer help", "Post what you need or what you can give, and track it until it is resolved."],
              ["users", "Find the right people", "Search by skill, language and the markets people know."],
              ["cal", "Meet in person", "Monthly gatherings in your Village, and events in other cities."],
              ["globe", "Explore new markets", "Talk to members who already build where you want to go."],
            ] as const
          ).map(([icon, title, text]) => (
            <div className="panel" key={title}>
              <Ic name={icon} style={{ color: "var(--blue)" }} />
              <h3 style={{ fontSize: 14, marginTop: 10 }}>{title}</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>Villages</h2>
          <Link href="/villages" style={{ fontWeight: 600 }}>
            See all Villages
          </Link>
        </div>
        <div className="g3">
          {ordered.slice(0, 3).map((village) => (
            <VillageCard key={village.slug} village={village} />
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="story">
          <div className="img" role="img" aria-label="Members in conversation" />
          <div>
            <span className="chip chip-pink">From the founder</span>
            <h3 style={{ fontSize: 20, marginTop: 12, maxWidth: "28ch" }}>
              Six countries, one lesson: local belonging needs global
              continuity.
            </h3>
            <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
              Kristiane Charrier on rebuilding her network at every move, and
              why the first ExpatPreneurs community in Luanda shaped everything
              that followed.
            </p>
            <Link className="btn btn-ghost btn-sm" href="/media">
              Read the story
            </Link>
          </div>
        </div>
      </section>

      {businesses && businesses.length ? (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>Businesses in the network</h2>
            <Link href="/businesses" style={{ fontWeight: 600 }}>
              Browse all
            </Link>
          </div>
          <div className="g3">
            {businesses.map((biz, i) => (
              <BusinessCard key={biz.id} biz={biz as BusinessRow} i={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="band">
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 22 }}>Ready to find your Village?</h2>
            <p style={{ marginTop: 6 }}>
              ExpatPreneurs is by invitation. Membership itself is free; the
              paid plan adds every Village.
            </p>
          </div>
          <Link className="btn btn-mint" href="/apply">
            Request your invitation
          </Link>
          <Link className="btn btn-ghost" href="/events">
            Come to an open evening
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\page.tsx" $f2

$f3 = @'
-- The home page, written out as blocks.
--
-- Every section below is the prototype's home page, in its order and
-- with its own words: the hero and the proverb, the three layers, the
-- Industry Groups and Pods strip, the four cards, the Villages, the
-- founder story, the businesses, and the closing band.
--
-- It is saved as a draft. The coded home page keeps rendering until
-- somebody presses Publish in Global team, Content, Pages, so you can
-- compare the two and only switch when they match.

update pages
set blocks = '[
 {
  "type": "hero",
  "heading": "Your business needs a village too.",
  "text": "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Find your Village",
  "second_href": "/villages",
  "quote": "\"It takes a village to raise a child.\" We believe the same is true of the businesses we build far from home."
 },
 {
  "type": "layers",
  "heading": "Big enough to open doors. Small enough to know each other.",
  "text": "Every member belongs to three places at once. As the network grows, your home base stays human sized.",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "panel",
  "tone": "mint",
  "body": "**Across all three:** Industry Groups connect you with people in your field, and Pods bring a few members together around a shared goal.",
  "button_label": "How it works",
  "button_href": "/how-it-works"
 },
 {
  "type": "features",
  "heading": "What members do here",
  "columns": "4",
  "items": "Ask and offer help | Post what you need or what you can give, and track it until it is resolved.\nFind the right people | Search by skill, language and the markets people know.\nMeet in person | Monthly gatherings in your Village, and events in other cities.\nExplore new markets | Talk to members who already build where you want to go."
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "story",
  "heading": "Six countries, one lesson: local belonging needs global continuity.",
  "body": "Kristiane Charrier on rebuilding her network at every move, and why the first ExpatPreneurs community in Luanda shaped everything that followed.",
  "button_href": "/media/six-countries-one-lesson-local-belonging-needs-global-continuity"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "3",
  "more_href": "/businesses"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "text": "ExpatPreneurs is by invitation. Membership itself is free; the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Come to an open evening",
  "second_href": "/events"
 }
]'::jsonb,
    title = 'Home',
    path = '/',
    updated_at = now()
where slug = 'home';

insert into pages (slug, title, path, status, blocks)
select 'home', 'Home', '/', 'draft', '[
 {
  "type": "hero",
  "heading": "Your business needs a village too.",
  "text": "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Find your Village",
  "second_href": "/villages",
  "quote": "\"It takes a village to raise a child.\" We believe the same is true of the businesses we build far from home."
 },
 {
  "type": "layers",
  "heading": "Big enough to open doors. Small enough to know each other.",
  "text": "Every member belongs to three places at once. As the network grows, your home base stays human sized.",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "panel",
  "tone": "mint",
  "body": "**Across all three:** Industry Groups connect you with people in your field, and Pods bring a few members together around a shared goal.",
  "button_label": "How it works",
  "button_href": "/how-it-works"
 },
 {
  "type": "features",
  "heading": "What members do here",
  "columns": "4",
  "items": "Ask and offer help | Post what you need or what you can give, and track it until it is resolved.\nFind the right people | Search by skill, language and the markets people know.\nMeet in person | Monthly gatherings in your Village, and events in other cities.\nExplore new markets | Talk to members who already build where you want to go."
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "story",
  "heading": "Six countries, one lesson: local belonging needs global continuity.",
  "body": "Kristiane Charrier on rebuilding her network at every move, and why the first ExpatPreneurs community in Luanda shaped everything that followed.",
  "button_href": "/media/six-countries-one-lesson-local-belonging-needs-global-continuity"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "3",
  "more_href": "/businesses"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "text": "ExpatPreneurs is by invitation. Membership itself is free; the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Come to an open evening",
  "second_href": "/events"
 }
]'::jsonb
where not exists (select 1 from pages where slug = 'home');
'@
Write-File "supabase\migrations\0049_home_page_blocks.sql" $f3

git add app lib supabase
git commit -m "The home page as blocks, section for section"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0049_home_page_blocks.sql"
    Write-Host ""
    Write-Host "Then: Global team, Content, Pages, Home. Compare, then Publish."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
