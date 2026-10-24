# 135-the-last-ten-pages-as-blocks.ps1
# Discover, Villages, Events, Businesses, Learning, Media, Watch and
# Listen, Members, Contact and the invitation form. One migration:
# 0051_public_pages_as_blocks.sql.
#
# Four block types had to exist first, because these pages are made of
# things the catalogue did not have: Members, from the database and
# only those who chose to be listed; Videos and episodes; Podcast
# shows; and a Form, which points at one of the real forms rather than
# pretending to be one. Twenty three block types now.
#
# Every one of the ten pages now prefers its published blocks and falls
# back to the coded page until somebody publishes it. That fallback is
# one small component rather than ten copies of the same check, so a
# page that is unpublished, or emptied by mistake, still works.
#
# What is honest about this batch: these ten are the pages with filters,
# tabs and search built into them. The blocks give you the sections,
# the headings, the bands and the lists, from your data. They do not
# give you the filter chips or the tabs as separate things you can
# move; those still belong to the coded page. So for Events or
# Businesses, publishing the blocks trades the filters for a page you
# can rearrange. That is a real trade and you should make it
# deliberately, page by page, which is why every one is a draft.
#
# If you want the filters as a block, say so and it becomes one:
# "Events, with filters" is a setting on the events block, not a new
# idea.
#
# Full paths for this script:
#   C:\\Users\\HP\\Desktop\\expatpreneur\\lib\\blocks.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\blocks.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\cards.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\page-blocks.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\global\\content\\[slug]\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\discover\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\villages\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\events\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\businesses\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\learning\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\media\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\watch\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\members\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\contact\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\apply\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\supabase\\migrations\\0051_public_pages_as_blocks.sql
#
#   powershell -ExecutionPolicy Bypass -File .\135-the-last-ten-pages-as-blocks.ps1

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

export type FieldKind =
  | "text"
  | "long"
  | "url"
  | "link"
  | "image"
  | "select"
  | "number"
  | "colour";

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
const K = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "link", hint });
const C = (name: string, label: string, hint?: string): BlockField => ({ name, label, kind: "colour", hint });

// Every address on the public site, so a link is chosen rather than
// typed. "Somewhere else" lets a full address be written by hand.
export const SITE_LINKS: [string, string][] = [
  ["", "Nowhere"],
  ["/", "Home"],
  ["/discover", "Discover"],
  ["/how-it-works", "How it works"],
  ["/membership", "Membership"],
  ["/villages", "Villages"],
  ["/villages/suggest", "Suggest a city"],
  ["/events", "Events"],
  ["/businesses", "Businesses"],
  ["/learning", "Learning"],
  ["/media", "Media"],
  ["/watch", "Watch and Listen"],
  ["/members", "Members"],
  ["/contact", "Contact"],
  ["/apply", "Request an invitation"],
  ["/apply/status", "Invitation status"],
  ["/login", "Log in"],
  ["/legal/privacy", "Privacy"],
  ["/legal/terms", "Terms"],
  ["/legal/cookies", "Cookies"],
  ["custom", "Somewhere else"],
];

// The palette, as colours rather than class names, so a block can be
// tinted without touching the stylesheet.
export const COLOURS: [string, string][] = [
  ["", "None"],
  ["#FFFFFF", "White"],
  ["#F4F6F8", "Pale grey"],
  ["#2C3E50", "Navy"],
  ["#4074AE", "Blue"],
  ["#A8DCD1", "Mint"],
  ["#FEEEEC", "Pink"],
  ["#F2A65A", "Sun"],
  ["#0F1419", "Ink"],
  ["custom", "A colour of my own"],
];

// Settings every block has: how it sits on the page, and its colours.
export const STYLE_FIELDS: BlockField[] = [
  S("width", "Width", [["", "Normal"], ["narrow", "Narrow"], ["wide", "Full width"]]),
  S("align", "Text", [["", "Left"], ["center", "Centred"]]),
  S("space", "Space around it", [["", "Normal"], ["tight", "Tight"], ["roomy", "Roomy"], ["none", "None"]]),
  C("bg", "Background colour"),
  C("ink", "Text colour"),
  S("size", "Heading size", [["", "Normal"], ["large", "Large"], ["small", "Small"]]),
  S("round", "Corners", [["", "Square"], ["soft", "Rounded"]]),
];
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
      K("button_href", "Button goes to"),
      T("second_label", "Second button"),
      K("second_href", "Second button goes to"),
      S("art", "What sits beside the text", [
        ["preview", "The preview panel: a profile, an event and the cities"],
        ["", "Nothing"],
        ["image", "A photograph"],
      ]),
      I("image_url", "Photograph", "Used when you choose a photograph above."),
      L("quote", "Line in the margin", "The bordered line under the buttons."),
      S("layout", "Layout", [["", "Text left, picture right"], ["center", "Centred"]]),
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
      K("button_href", "Button goes to"),
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
      K("button_href", "Button goes to"),
      T("second_label", "Second button"),
      K("second_href", "Second button goes to"),
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
      K("more_href", "See all goes to"),
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
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "businesses",
    label: "Businesses",
    about: "Member businesses, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), K("more_href", "See all goes to")],
  },
  {
    type: "courses",
    label: "Learning",
    about: "Courses, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), K("more_href", "See all goes to")],
  },
  {
    type: "articles",
    label: "Stories",
    about: "Published articles, from the database.",
    fields: [T("heading", "Heading"), N("limit", "How many"), K("more_href", "See all goes to")],
  },
  {
    type: "people",
    label: "Members",
    about: "Member cards, from the database. Only members who chose to be listed.",
    fields: [T("heading", "Heading"), N("limit", "How many"), K("more_href", "See all goes to")],
  },
  {
    type: "videos",
    label: "Videos and episodes",
    about: "What is in Watch and Listen, from the database.",
    fields: [
      T("heading", "Heading"),
      S("kind", "Which", [["", "Everything"], ["video", "Videos"], ["episode", "Podcast episodes"]]),
      N("limit", "How many"),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "shows",
    label: "Podcast shows",
    about: "The shows, each with what it is and how many episodes.",
    fields: [T("heading", "Heading"), K("more_href", "See all goes to")],
  },
  {
    type: "form",
    label: "A form",
    about: "One of the forms the platform already has, dropped onto the page.",
    fields: [
      S("which", "Which form", [
        ["contact", "Contact"],
        ["apply", "Request an invitation"],
        ["suggest", "Suggest a city"],
        ["newsletter", "Newsletter sign up"],
      ]),
      T("heading", "Heading"),
      L("text", "Line above the form"),
    ],
  },
  {
    type: "story",
    label: "Featured story",
    about: "One story in the pink panel, as on the home page.",
    fields: [T("heading", "Heading"), L("body", "Text"), I("image_url", "Photograph"), K("button_href", "Read it goes to")],
  },
  {
    type: "plans",
    label: "Plans",
    about: "The membership cards, priced from the database.",
    fields: [T("heading", "Heading"), L("text", "Line underneath")],
  },
];

// Every block carries the style settings as well as its own fields.
export const blockSpec = (type: string) => {
  const b = BLOCKS.find((x) => x.type === type);
  return b ? { ...b, fields: [...b.fields, ...STYLE_FIELDS] } : undefined;
};
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
import { HeroPreview, Av } from "@/components/bits";
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
  people?: { id: string; full_name: string; headline: string | null; industry?: string | null; avatar_url?: string | null }[];
  media?: { id: string; slug: string; kind: string; title: string; summary?: string | null; duration?: string | null; cover_url?: string | null }[];
  shows?: { slug: string; name: string; about: string | null; cover_url?: string | null }[];
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

    case "people": {
      const list = (data.people ?? []).slice(0, Number(b.limit) || 6);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((p) => (
              <Link className="mcard" key={p.id} href={`/members/${p.id}`}>
                <div className="row">
                  <Av name={p.full_name} />
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontWeight: 650, display: "block" }}>{p.full_name}</b>
                    {p.headline ? <span className="where">{p.headline}</span> : null}
                  </div>
                </div>
                {p.industry ? (
                  <div className="tags">
                    <span className="chip">{p.industry}</span>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "videos": {
      let list = data.media ?? [];
      if (b.kind) list = list.filter((m) => m.kind === b.kind);
      list = list.slice(0, Number(b.limit) || 8);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="vgrid">
            {list.map((m) => (
              <Link className="vitem" key={m.id} href={`/watch/${m.slug}`}>
                <div
                  className="vthumb"
                  role="img"
                  aria-label={m.title}
                  style={m.cover_url ? { backgroundImage: `url('${m.cover_url}')` } : undefined}
                >
                  {m.duration ? <span className="vdur">{m.duration}</span> : null}
                </div>
                <div className="vtitle" style={{ marginTop: 10 }}>
                  {m.title}
                </div>
                {m.summary ? <div className="vsub">{m.summary}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "shows": {
      const list = data.shows ?? [];
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="pshows">
            {list.map((sh) => (
              <Link className="pshow linkrow" key={sh.slug} href={`/watch/show/${sh.slug}`}>
                {sh.cover_url ? (
                  <div
                    className="photo"
                    role="img"
                    aria-label={sh.name}
                    style={{ height: 120, backgroundImage: `url('${sh.cover_url}')` }}
                  />
                ) : (
                  <span className="pcover">
                    <b>{sh.name}</b>
                  </span>
                )}
                <div>
                  <b style={{ fontSize: 15 }}>{sh.name}</b>
                  {sh.about ? (
                    <p className="muted small" style={{ marginTop: 4 }}>
                      {sh.about}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "form": {
      // The forms belong to their own pages, which hold the action and
      // the captcha. A block points at one rather than copying it.
      const where: Record<string, [string, string]> = {
        contact: ["/contact", "Open the contact form"],
        apply: ["/apply", "Request your invitation"],
        suggest: ["/villages/suggest", "Suggest a city"],
        newsletter: ["/media", "Sign up for the newsletter"],
      };
      const [href, label] = where[b.which ?? "contact"] ?? where.contact;
      return (
        <section className="sec">
          <div className="panel">
            {b.heading ? <h3 style={{ fontSize: 15 }}>{b.heading}</h3> : null}
            {b.text ? (
              <div dangerouslySetInnerHTML={{ __html: toHtml(b.text) }} />
            ) : null}
            <Link className="btn btn-primary" href={href} style={{ marginTop: 12 }}>
              {label}
            </Link>
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
import { Ic } from "@/components/icon";
import { Av } from "@/components/bits";

// The Village photographs the prototype ships with, by slug. A Village
// it does not have a photograph for gets the hatched "future" block.
const VPHOTO: Record<string, string> = {
  dubai: "ph-dubai",
  lisbon: "ph-lisbon",
  paris: "ph-paris",
};

// The class carrying a Village's photograph, so the card and the Village
// page itself use the same one.
export function villagePhoto(slug: string) {
  return VPHOTO[slug] ?? "ph-future";
}

export const villageStatus: Record<string, [string, string]> = {
  open: ["Open for invitation requests", "chip-mint"],
  launching: ["Launching soon", "chip-sun"],
  exploring: ["Being explored", "chip-sun"],
  paused: ["Paused", ""],
  archived: ["Archived", ""],
};

export type VillageRow = {
  id?: string;
  slug: string;
  name: string;
  country: string | null;
  status: string;
  summary?: string | null;
  members?: number | null;
  circles?: number | null;
  cover_url?: string | null;
};

// vcard
export function VillageCard({ village }: { village: VillageRow }) {
  const [label, chip] = villageStatus[village.status] ?? [village.status, ""];
  const open = village.status === "open";
  return (
    <Link className="vcard" href={`/villages/${village.slug}`}>
      <div
        className={`vphoto ${villagePhoto(village.slug)}`}
        role="img"
        aria-label={village.name}
        style={
          village.cover_url
            ? {
                background: `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`,
              }
            : undefined
        }
      >
        <h3>{village.name}</h3>
      </div>
      <div className="vbody">
        <span className={`chip ${chip}`} style={{ alignSelf: "flex-start" }}>
          {label}
        </span>
        <p className="muted small">
          {village.country}.{" "}
          {open
            ? `${village.members ?? 0} members in ${village.circles ?? 0} Circle${
                (village.circles ?? 0) === 1 ? "" : "s"
              }.`
            : "Opening soon."}
        </p>
        <span
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: "flex-start", marginTop: "auto" }}
        >
          {open ? `Explore ${village.name}` : "Join the waitlist"}
        </span>
      </div>
    </Link>
  );
}

const TONES = ["ct-blue", "ct-mint", "ct-navy", "ct-sun", "ct-pink"];

export type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  summary?: string | null;
  // Some pages select the shorter columns instead.
  tagline?: string | null;
  industry?: string | null;
  offer?: string | null;
  logo_url?: string | null;
  owner_name?: string | null;
  village_name?: string | null;
};

// bizCard. Where there is no photograph yet, a colour block carries the
// card, which is what the prototype does everywhere else.
export function BusinessCard({ biz, i = 0, href }: { biz: BusinessRow; i?: number; href?: string }) {
  return (
    <Link className="bizcard" href={href ?? `/businesses/${biz.slug}`}>
      {biz.logo_url ? (
        <div
          className="photo"
          role="img"
          aria-label={biz.name}
          style={{ height: 120, backgroundImage: `url('${biz.logo_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 120 }}>
          <b>{biz.name}</b>
          {biz.category ? <span>{biz.category}</span> : null}
        </span>
      )}
      <div className="b">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>{biz.name}</b>
          {biz.category ? <span className="chip">{biz.category ?? biz.industry}</span> : null}
        </div>
        <p className="muted small">{biz.summary ?? biz.tagline}</p>
        {biz.offer ? (
          <span className="chip chip-mint" style={{ alignSelf: "flex-start" }}>
            <Ic name="tag" style={{ width: 13, height: 13 }} />
            {biz.offer}
          </span>
        ) : null}
        {biz.owner_name ? (
          <div className="row small muted" style={{ marginTop: "auto" }}>
            <Av name={biz.owner_name} className="av-sm" />
            {biz.owner_name}
            {biz.village_name ? `, ${biz.village_name}` : ""}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  level?: string | null;
  format?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  cover_url?: string | null;
};

// The prototype's course card: a photograph, the format, the title and
// the price.
export function CourseCard({ course, i = 0, href }: { course: CourseRow; i?: number; href?: string }) {
  const price = course.price_cents
    ? `${(course.price_cents / 100).toFixed(0)} ${course.currency ?? "EUR"}`
    : "Free";
  return (
    <Link className="coursecard" href={href ?? `/learning/${course.slug}`}>
      {course.cover_url ? (
        <div
          className="photo"
          role="img"
          aria-label={course.title}
          style={{ height: 130, backgroundImage: `url('${course.cover_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 130 }}>
          <b>{course.title}</b>
        </span>
      )}
      <div className="b">
        <span className="chip" style={{ alignSelf: "flex-start" }}>
          {course.format === "live" ? "Live workshop" : "Recorded"}
        </span>
        <b>{course.title}</b>
        <div className="row" style={{ justifyContent: "space-between", marginTop: "auto" }}>
          <b>{price}</b>
          {course.level ? <span className="small muted">{course.level}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  kind?: string;
  cover_url?: string | null;
};

// The prototype's article card.
export function ArticleCard({ article, i = 0, href }: { article: ArticleRow; i?: number; href?: string }) {
  return (
    <Link className="artcard" href={href ?? `/media/${article.slug}`}>
      {article.cover_url ? (
        <div
          className="photo"
          role="img"
          aria-label={article.title}
          style={{ height: 170, backgroundImage: `url('${article.cover_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 170 }}>
          <b>{article.title}</b>
        </span>
      )}
      {article.kind ? (
        <span className="chip chip-pink" style={{ alignSelf: "flex-start" }}>
          {article.kind}
        </span>
      ) : null}
      <b style={{ fontSize: 15 }}>{article.title}</b>
      {article.standfirst ? <p className="muted small">{article.standfirst}</p> : null}
    </Link>
  );
}
'@
Write-File "components\cards.tsx" $f2

$f3 = @'
import { livePage } from "@/lib/pages";
import { Blocks, type BlockData } from "@/components/blocks";

// A page that has been published from the builder shows its blocks.
// Until then it shows the version in the code, which is what sits
// inside this component. Nothing changes for a page nobody has
// published, and nothing is lost if somebody unpublishes one.
export async function PageBlocks({
  slug,
  data,
  children,
}: {
  slug: string;
  data?: BlockData;
  children: React.ReactNode;
}) {
  const page = await livePage(slug);
  if (!page || !(page.blocks ?? []).length) return <>{children}</>;
  return <Blocks blocks={page.blocks} data={data ?? {}} />;
}
'@
Write-File "components\page-blocks.tsx" $f3

$f4 = @'
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

  const [
    { data: page },
    { data: villages },
    { data: counts },
    { data: events },
    { data: businesses },
    { data: courses },
    { data: articles },
    { data: plans },
    { data: people },
    { data: media },
    { data: shows },
  ] =
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
      supabase
        .from("profiles")
        .select("id, full_name, headline, industry, avatar_url")
        .eq("public_profile", true)
        .eq("status", "active")
        .limit(6),
      supabase
        .from("media_items")
        .select("id, slug, kind, title, summary, duration, cover_url")
        .not("published_at", "is", null)
        .limit(8),
      supabase.from("shows").select("slug, name, about, cover_url").limit(4),
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
          people: people ?? [],
          media: media ?? [],
          shows: shows ?? [],
        }}
      />
    </>
  );
}
'@
Write-File "app\global\content\[slug]\page.tsx" $f4

$f5 = @'
import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { DCard, DPerson, DSec, DBand } from "@/components/discover-cards";
import { Ic } from "@/components/icon";
import { whenText } from "@/lib/events";

export const metadata = {
  title: "Discover, ExpatPreneurs Global",
  description:
    "The Villages, Circles, people and events of a network of people building a business away from home.",
};

const TABS: [string, string][] = [
  ["featured", "Featured"],
  ["villages", "Villages"],
  ["circles", "Circles"],
  ["people", "People"],
  ["groups", "Groups and Pods"],
  ["events", "Events"],
  ["learning", "Learning and business"],
  ["media", "Watch and listen"],
];

const statusLine: Record<string, string> = {
  open: "Open for invitation requests",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused",
  archived: "Archived",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string }>;
}) {
  const { show = "featured", q = "" } = await searchParams;
  const supabase = await createClient();

  // Every query here runs for somebody who is not signed in, so the database
  // decides what comes back: public profiles, public events, published
  // courses, and media that is not marked members only.
  const [
    { data: villages },
    { data: circles },
    { data: people },
    { data: groups },
    { data: events },
    { data: courses },
    { data: businesses },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .order("name"),
    supabase
      .from("circles")
      .select("id, name, capacity, village_id, status")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, headline, business_name, industry, village_id")
      .eq("public_profile", true)
      .eq("status", "active")
      .order("full_name")
      .limit(24),
    supabase
      .from("industry_groups")
      .select("id, slug, name, description")
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, slug, title, description, starts_at, ends_at, timezone, venue, is_online, village_id"
      )
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(12),
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration")
      .eq("status", "published")
      .order("title")
      .limit(12),
    supabase
      .from("businesses")
      .select("id, slug, name, category, summary, image_url")
      .eq("public", true)
      .limit(8),
    supabase
      .from("media_items")
      .select("id, slug, kind, title, summary, duration, published_at")
      .eq("member_only", false)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const match = (...fields: (string | null | undefined)[]) =>
    !q || fields.some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase()));

  const shown = (key: string) => show === "featured" || show === key;
  const tabHref = (key: string) =>
    `/discover?show=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const vills = (villages ?? []).filter((v) =>
    match(v.name, v.city, v.country, v.summary)
  );
  const circs = (circles ?? []).filter((c) => match(c.name));
  const pers = (people ?? []).filter((p) =>
    match(p.full_name, p.headline, p.business_name, p.industry)
  );
  const grps = (groups ?? []).filter((g) => match(g.name, g.description));
  const evs = (events ?? []).filter((e) => match(e.title, e.description, e.venue));
  const crs = (courses ?? []).filter((c) => match(c.title, c.summary));
  const bizs = (businesses ?? []).filter((b) => match(b.name, b.category, b.summary));
  const meds = (media ?? []).filter((m) => match(m.title, m.summary));

  const found =
    vills.length + circs.length + pers.length + grps.length +
    evs.length + crs.length + bizs.length + meds.length;

  return (
    <PublicPage active="/discover">
      <PageBlocks slug="discover">
      <section className="pubsec dhero">
        <h1>Wherever you have landed, there is a Village for you</h1>
        <p className="intro">
          Find the Villages, Circles and people building a business away from
          home.
        </p>

        <form className="input dsearch" action="/discover">
          <Ic name="search" />
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search Villages, Circles, members, events and businesses"
            aria-label="Search the network"
            autoComplete="off"
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Search
          </button>
        </form>

        {q ? (
          <p className="dcount">
            {found
              ? `${found} ${found === 1 ? "result" : "results"} for "${q}"`
              : `Nothing matches "${q}" yet. Try a city, an industry or a name.`}
          </p>
        ) : null}

        <div className="dpills">
          {TABS.map(([key, label]) => (
            <Link
              className={`dpill ${show === key ? "on" : ""}`}
              href={tabHref(key)}
              key={key}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        {shown("villages") && vills.length ? (
          <DSec title="Villages" href="/villages">
            {vills.map((v, i) => (
              <DCard
                key={v.id}
                i={i}
                href={`/villages/${v.slug}`}
                kicker={v.country}
                title={v.name}
                sub={v.summary}
                meta={statusLine[v.status] ?? v.status}
              />
            ))}
          </DSec>
        ) : null}

        {shown("people") && pers.length ? (
          <DSec title="Members you will meet" href="/members" people>
            {pers.slice(0, 10).map((p, i) => (
              <DPerson
                key={p.id}
                i={i}
                href={`/members/${p.id}`}
                name={p.full_name}
                line={[p.industry, villageName(p.village_id)]
                  .filter(Boolean)
                  .join(", ")}
              />
            ))}
          </DSec>
        ) : null}

        {shown("circles") && circs.length ? (
          <DSec title="Circles">
            {circs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href="/how-it-works"
                kicker={`${villageName(c.village_id)} Village`}
                title={c.name}
                sub={
                  c.status === "open"
                    ? "Welcoming new members this month"
                    : "Opens when a Circle reaches 45 members"
                }
                meta={`Up to ${c.capacity} members`}
              />
            ))}
          </DSec>
        ) : null}

        {show === "featured" ? (
          <DBand
            title="ExpatPreneurs grows through introductions."
            line="Know someone who belongs here?"
            cta="Request your invitation"
            href="/apply"
          />
        ) : null}

        {shown("groups") && grps.length ? (
          <DSec title="Industry Groups and Pods">
            {grps.map((g, i) => (
              <DCard
                key={g.id}
                i={i + 2}
                href="/groups"
                kicker="Industry Group"
                title={g.name}
                sub={g.description}
              />
            ))}
          </DSec>
        ) : null}

        {shown("events") && evs.length ? (
          <DSec title="Events" href="/events">
            {evs.map((e, i) => (
              <DCard
                key={e.id}
                i={i}
                href={`/events/${e.slug}`}
                kicker={whenText(e)}
                title={e.title}
                sub={e.description}
                meta={e.is_online ? "Online" : e.venue}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && crs.length ? (
          <DSec title="Learning" href="/learning">
            {crs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href={`/learning/${c.slug}`}
                kicker={c.duration ?? c.level}
                title={c.title}
                sub={c.summary}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && bizs.length ? (
          <DSec title="Businesses in the network" href="/businesses">
            {bizs.map((b, i) => (
              <DCard
                key={b.id}
                i={i + 3}
                href={`/businesses/${b.slug}`}
                kicker={b.category}
                title={b.name}
                sub={b.summary}
                image={b.image_url}
              />
            ))}
          </DSec>
        ) : null}

        {shown("media") && meds.length ? (
          <DSec title="Watch and listen" href="/watch">
            {meds.map((m, i) => (
              <DCard
                key={m.id}
                i={i + 2}
                href={`/watch/${m.slug}`}
                kicker={[m.kind, m.duration].filter(Boolean).join(", ")}
                title={m.title}
                sub={m.summary}
              />
            ))}
          </DSec>
        ) : null}
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <DBand
          end
          title="Find the Village nearest you."
          line="If there is not one yet, tell us where you are."
          cta="Request your invitation"
          href="/apply"
        />
      </section>
          </PageBlocks>
</PublicPage>
  );
}
'@
Write-File "app\discover\page.tsx" $f5

$f6 = @'
import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
import { PublicPage } from "@/components/public-page";
import { VillageCard, type VillageRow } from "@/components/cards";

export const metadata = {
  title: "Villages, ExpatPreneurs Global",
  description:
    "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.",
};

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["open", "Open"],
  ["soon", "Launching soon"],
];

export default async function VillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();
  const t = await pageText("villages");

  const [{ data: villages }, { data: counts }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .order("name"),
    supabase.from("village_public_counts").select("village_id, members, circles"),
  ]);

  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const rows = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }))
    .filter((v) =>
      show === "open"
        ? v.status === "open"
        : show === "soon"
          ? ["launching", "exploring"].includes(v.status)
          : true
    );

  return (
    <PublicPage active="/villages">
      <PageBlocks slug="villages">
      <section className="pubsec">
        <h2>{t("title", "Find your Village")}</h2>
        <p className="intro">
          {t("intro", "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.")}
        </p>

        <div className="filters">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key}
              className={`fchip ${show === key ? "on" : ""}`}
              href={`/villages?show=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="g3">
          {rows.map((village) => (
            <VillageCard key={village.id} village={village as VillageRow} />
          ))}
        </div>

        <div
          className="panel panel-wash"
          style={{
            marginTop: 22,
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ fontSize: 15 }}>No Village in your city yet?</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Tell us where you are. New Villages open when there are enough
              members and trusted people ready to host them.
            </p>
          </div>
          <Link className="btn btn-dark" href="/villages/suggest">
            Suggest your city
          </Link>
        </div>
      </section>
          </PageBlocks>
</PublicPage>
  );
}
'@
Write-File "app\villages\page.tsx" $f6

$f7 = @'
import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
import { whoIsHere } from "@/lib/member";
import { DualPage } from "@/components/dual-page";
import { PageHead } from "@/components/workspace-shell";
import { EventRow } from "@/components/feed";
import {
  whenText,
  priceText,
  registrationBlock,
  type EventRow as EventData,
} from "@/lib/events";

export const metadata = { title: "Events, ExpatPreneurs Global" };

// Open to everyone. A visitor sees the events that are open to the
// public; a member sees theirs, other Villages' and everything online.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();
  const t = await pageText("events");

  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  if (!member) query = query.eq("visibility", "public");

  const [{ data: events }, { data: registrations }, { data: villages }] =
    await Promise.all([
      query,
      member
        ? supabase
            .from("event_registrations")
            .select("event_id, status")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
      supabase.from("villages").select("id, name"),
    ]);

  const registeredFor = new Set(
    (registrations ?? [])
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.event_id)
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const rows = ((events ?? []) as EventData[]).filter((event) => {
    if (!member) return true;
    if (show === "mine") return registeredFor.has(event.id);
    if (show === "village") return event.village_id === member.village_id;
    if (show === "other")
      return event.village_id && event.village_id !== member.village_id;
    if (show === "online") return event.is_online;
    return true;
  });

  const FILTERS: [string, string][] = [
    ["all", "All"],
    ["village", "My Village"],
    ["other", "Other Villages"],
    ["online", "Online"],
    ["mine", "I am going"],
  ];

  return (
    <DualPage member={Boolean(member)} nav="/events" active="/events">
      <PageBlocks data={{ events: events ?? [] }} slug="events">
      {member ? (
        <PageHead
          title="Events"
          sub="Gatherings in your Village, in other Villages and online."
        />
      ) : (
        <section className="pubsec hero-center">
          <h1>{t("title", "Events")}</h1>
          <p className="intro">
            {t("intro", "Gatherings in every Village and online. Some are open to everyone; most are for members.")}
          </p>
        </section>
      )}

      <section className={member ? "sec" : "pubsec"} style={{ paddingTop: 0 }}>
        {member ? (
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/events?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing on the calendar yet.
            </p>
          </div>
        ) : (
          <div className="divide">
            {rows.map((event) => {
              const blocked = member ? registrationBlock(event, member) : null;
              const d = new Date(event.starts_at);
              const visiting = Boolean(
                member && event.village_id && event.village_id !== member.village_id
              );
              return (
                <EventRow
                  key={event.id}
                  cover={event.cover_url}
                  href={member ? `/events/${event.slug}` : `/e/${event.slug}`}
                  day={String(d.getDate())}
                  month={d.toLocaleDateString("en-GB", { month: "short" })}
                  title={event.title}
                  line={`${
                    event.village_id ? `${villageName(event.village_id)}. ` : ""
                  }${whenText(event)}${
                    event.is_online ? ", online" : event.venue ? `, ${event.venue}` : ""
                  }`}
                  visiting={visiting}
                  right={
                    registeredFor.has(event.id) ? (
                      <span className="chip chip-mint">You are going</span>
                    ) : blocked ? (
                      <span className="chip chip-sun">{blocked}</span>
                    ) : (
                      <span className="chip">{priceText(event)}</span>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {member ? null : (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="band">
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 22 }}>Most events are for members</h2>
              <p style={{ marginTop: 6 }}>
                Every Village holds at least one gathering a month, and members
                can visit the others.
              </p>
            </div>
            <Link className="btn btn-mint" href="/apply">
              Request your invitation
            </Link>
          </div>
        </section>
      )}
          </PageBlocks>
</DualPage>
  );
}
'@
Write-File "app\events\page.tsx" $f7

$f8 = @'
import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

export const metadata = { title: "Businesses, ExpatPreneurs Global" };

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; category?: string; done?: string }>;
}) {
  const { q = "", show = "all", category = "", done } = await searchParams;
  // The marketplace is open to anybody. What comes back is decided by the
  // database: a stranger sees the listings whose owners allow it.
  const member = await whoIsHere();
  const supabase = await createClient();

  let query = supabase
    .from("businesses")
    .select("id, slug, name, tagline, industry, serves, owner_id, village_id, category, offer, logo_url")
    .order("name")
    .limit(150);

  if (show === "mine" && member) query = query.eq("owner_id", member.id);
  if (show === "village" && member?.village_id) {
    query = query.eq("village_id", member.village_id);
  }
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,tagline.ilike.%${q}%,industry.ilike.%${q}%`
    );
  }

  const [{ data: businesses }, { data: villages }, { data: allCategories }] =
    await Promise.all([
      query,
      supabase.from("villages").select("id, name"),
      supabase.from("businesses").select("category").not("category", "is", null),
    ]);

  const categories = [
    ...new Set(
      (allCategories ?? [])
        .map((c) => c.category as string)
        .filter(Boolean)
    ),
  ].sort();

  const rows = (businesses ?? []).filter((b) =>
    category ? b.category === category : true
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <DualPage member={Boolean(member)} nav="/businesses" active="/businesses">
      <PageBlocks data={{ businesses: businesses ?? [] }} slug="businesses">
        <section className={member ? "sec" : "pubsec hero-center"}>
          <h1>Businesses</h1>
          <p className="lead">
            What members actually do, and which markets they already sell into.
          </p>
          {done ? <div className="flag ok">Saved.</div> : null}
          <p>
            <Link className="btn btn-primary" href="/businesses/new">
              Add your business
            </Link>
          </p>
          <form className="searchrow">
            <input name="q" defaultValue={q} placeholder="Name, industry or what they do" />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>
          <div className="filters">
            {(member
              ? ([
                  ["all", "Everywhere"],
                  ["village", "My Village"],
                  ["mine", "Mine"],
                ] as [string, string][])
              : ([["all", "All"]] as [string, string][])
            ).map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/businesses?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {categories.length ? (
            <div className="filters">
              <Link
                className={`fchip ${category ? "" : "on"}`}
                href={`/businesses?show=${show}`}
              >
                Every category
              </Link>
              {categories.map((name) => (
                <Link
                  key={name}
                  className={`fchip ${category === name ? "on" : ""}`}
                  href={`/businesses?show=${show}&category=${encodeURIComponent(name)}`}
                >
                  {name}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="sec">
          {rows.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing here yet. Yours could be the first.
              </p>
            </div>
          ) : (
            <div className="g3">
              {rows.map((business) => (
                <Link
                  className="panel"
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                >
                  {business.industry ? (
                    <span className="chip">{business.industry}</span>
                  ) : null}
                  <h3 style={{ marginTop: 10 }}>{business.name}</h3>
                  <p className="muted small">{business.tagline}</p>
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    {villageName(business.village_id)}
                    {(business.serves ?? []).length
                      ? `. Sells into ${(business.serves ?? []).join(", ")}`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {member ? null : (
          <section className="pubsec" style={{ paddingTop: 0 }}>
            <div className="band">
              <div style={{ flex: 1, minWidth: 240 }}>
                <h2 style={{ fontSize: 18 }}>Run a business abroad?</h2>
                <p style={{ marginTop: 4 }}>
                  Members can list their business here once they are in.
                </p>
              </div>
              <Link className="btn btn-mint" href="/apply">
                Request your invitation
              </Link>
            </div>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
'@
Write-File "app\businesses\page.tsx" $f8

$f9 = @'
import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";

export const metadata = { title: "Learning, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

export default async function LearningPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  // Anybody can look at the catalogue. What it costs, and whether you can
  // start it, depends on who is reading.
  const member = await whoIsHere();
  const supabase = await createClient();

  const [{ data: courses }, { data: mine }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration, tier, educator_id, cover_url, price_cents, member_price_cents, currency, public_listing, format, starts_at")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    member
      ? supabase
          .from("course_progress")
          .select("course_id, lessons, done")
          .eq("profile_id", member.id)
      : Promise.resolve({ data: [] }),
  ]);

  const educatorIds = [
    ...new Set((courses ?? []).map((c) => c.educator_id).filter(Boolean)),
  ] as string[];
  const { data: educators } = educatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", educatorIds)
    : { data: [] };

  const progressOf = (id: string) => mine?.find((m) => m.course_id === id);

  const money = (cents: number, currency: string) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

  const priceOf = (course: {
    price_cents: number;
    member_price_cents: number | null;
    currency: string;
  }) => {
    const cents = member
      ? course.member_price_cents ?? course.price_cents
      : course.price_cents;
    return cents === 0 ? "Free" : money(cents, course.currency);
  };

  // Somebody who is not signed in sees only what is offered publicly.
  const visible = (courses ?? []).filter((c) => member || c.public_listing);

  const shown = visible.filter((c) => {
    if (show === "live") return c.format === "live";
    if (show === "recorded") return c.format !== "live";
    if (show === "free") {
      const cents = member ? c.member_price_cents ?? c.price_cents : c.price_cents;
      return cents === 0;
    }
    return true;
  });

  return (
    <DualPage member={Boolean(member)} nav="/learning" active="/learning">
      <PageBlocks data={{ courses: courses ?? [] }} slug="learning">
        <section className={member ? "sec" : "pubsec hero-center"}>
          <h1>Learning</h1>
          <p className="lead">
            Short courses from members who have already done the thing, not
            from people who read about it.
          </p>

          <div className="filters">
            {(
              [
                ["all", "All"],
                ["live", "Live"],
                ["recorded", "Recorded"],
                ["free", "Free"],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/learning?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {shown.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="g3">
              {shown.map((course, i) => {
                const progress = progressOf(course.id);
                const locked =
                  course.tier === "paid" && (!member || !isPaid(member));
                return (
                  <article className="card" key={course.id}>
                    <Link href={`/learning/${course.slug}`}>
                      {course.cover_url ? (
                        <div className="cover photo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.cover_url} alt="" />
                        </div>
                      ) : (
                        <div className={`cover ${covers[i % covers.length]}`}>
                          {course.title}
                        </div>
                      )}
                      <div className="kind">
                        {course.format === "live" ? "Live workshop" : "Recorded"}
                        {course.duration ? `, ${course.duration}` : ""}
                      </div>
                      <p>{course.summary}</p>
                      <div className="meta">
                        {progress ? (
                          <span className="chip chip-mint">
                            {progress.done} of {progress.lessons} done
                          </span>
                        ) : locked ? (
                          <span className="chip chip-sun">Paid plan</span>
                        ) : (
                          <>
                            <span className="chip">{priceOf(course)}</span>{" "}
                            <span className="chip">
                              {educators?.find((e) => e.id === course.educator_id)
                                ?.full_name ?? "A member"}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="sec">
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 15 }}>Teach in the network</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Paid members can apply to become educators and earn from their
              workshops. ExpatPreneurs handles the payment and pays you your
              share.
            </p>
            <Link
              className="btn btn-ghost btn-sm"
              href={member ? "/educator" : "/membership"}
            >
              {member ? "Your teaching" : "See membership"}
            </Link>
          </div>
        </section>

        {member ? null : (
          <section className="sec">
            <h2>Members pay less, and some courses are theirs alone</h2>
            <p className="lead">
              Anyone can buy these. Members get the member price, and the
              courses written for the network.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>{" "}
              <Link className="btn btn-ghost" href="/membership">
                What membership costs
              </Link>
            </p>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
'@
Write-File "app\learning\page.tsx" $f9

$f10 = @'
import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SubscribeForm } from "./subscribe-form";

export const metadata = {
  title: "Media, ExpatPreneurs Global",
  description:
    "Stories about members building a business away from home, and what they learned doing it.",
};

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

const kindLabel: Record<string, string> = {
  story: "Member story",
  guide: "Guide",
  note: "Note",
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "" } = await searchParams;
  const supabase = await createClient();
  const me = await whoIsHere();

  let query = supabase
    .from("articles")
    .select("id, slug, kind, title, standfirst, cover_url, member_only, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  if (kind) query = query.eq("kind", kind);

  const { data: articles } = await query;

  return (
    <DualPage member={Boolean(me)} nav="/media" active="/media">
      <PageBlocks data={{ articles: articles ?? [] }} slug="media">
        <section className={me ? "sec" : "pubsec hero-center"}>
          <h1>Media</h1>
          <p className="lead">
            Stories about members building a business away from home, and what
            they learned doing it.
          </p>
          <div className="tabs">
            <Link className={`chip ${kind ? "" : "chip-mint"}`} href="/media">
              Everything
            </Link>
            <Link
              className={`chip ${kind === "story" ? "chip-mint" : ""}`}
              href="/media?kind=story"
            >
              Member stories
            </Link>
            <Link
              className={`chip ${kind === "guide" ? "chip-mint" : ""}`}
              href="/media?kind=guide"
            >
              Guides
            </Link>
            <Link
              className={`chip ${kind === "note" ? "chip-mint" : ""}`}
              href="/media?kind=note"
            >
              Notes
            </Link>
          </div>
        </section>

        <section className="sec">
          {(articles ?? []).length === 0 ? (
            <p className="muted">Nothing published here yet.</p>
          ) : (
            <div className="g3 g4">
              {(articles ?? []).map((article, i) => (
                <Link className="card" href={`/media/${article.slug}`} key={article.id}>
                  {article.cover_url ? (
                    <div className="cover photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.cover_url} alt="" />
                    </div>
                  ) : (
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {article.title}
                    </div>
                  )}
                  <div className="kind">{kindLabel[article.kind] ?? article.kind}</div>
                  <p>
                    <b>{article.title}</b>
                    {article.standfirst ? `. ${article.standfirst}` : ""}
                  </p>
                  {article.member_only ? (
                    <div className="meta">
                      <span className="chip">Members only</span>
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="sec">
          <div className="panel panel-wash" style={{ maxWidth: 520 }}>
            <h3>The newsletter</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Member stories and what is opening where, once a month. Members
              can switch it off in their settings, and anybody can
              unsubscribe from the email itself.
            </p>
            <SubscribeForm source="media" />
          </div>
        </section>

        {me ? (
          <section className="sec">
            <div className="panel panel-wash">
              <h3>There is a story here</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Something you did, something another member did, or something
                two of you did together. Tell the team about it.
              </p>
              <Link className="btn btn-ghost" href="/media/suggest">
                Suggest a story
              </Link>
            </div>
          </section>
        ) : (
          <section className="sec">
            <h2>The people in these stories are members</h2>
            <p className="lead">
              Membership is by invitation and costs nothing.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>
            </p>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
'@
Write-File "app\media\page.tsx" $f10

$f11 = @'
import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";

export const metadata = { title: "Watch and Listen, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

const kindLabel: Record<string, string> = {
  video: "Video",
  episode: "Podcast",
  article: "Article",
};

// Open to everyone. Members also see the pieces kept for members.
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();

  const user = await currentUser();

  let query = supabase
    .from("media_items")
    .select("id, slug, kind, title, summary, duration, member_only, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  if (show !== "all") query = query.eq("kind", show);

  const [{ data: items }, { data: shows }] = await Promise.all([
    query,
    supabase
      .from("shows")
      .select("slug, name, about, cover_url")
      .order("name"),
  ]);

  // How many episodes each show has, so the row can say.
  const { data: episodeCounts } = await supabase
    .from("media_items")
    .select("show_slug")
    .eq("kind", "episode")
    .not("published_at", "is", null);

  const episodesIn = (slug: string) =>
    (episodeCounts ?? []).filter((e) => e.show_slug === slug).length;

  return (
    <DualPage member={Boolean(user)} nav="/watch" active="/watch">
      <PageBlocks slug="watch">
        <section className={user ? "sec" : "pubsec hero-center"}>
          <h1>Watch and Listen</h1>
          <p className="lead">
            Members talking about what building a business away from home
            actually takes.
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["video", "Videos"],
              ["episode", "Podcast"],
              ["article", "Articles"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/watch?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
</section>

        {(shows ?? []).length && show !== "video" && show !== "article" ? (
          <section className="sec">
            <div className="sechead">
              <h2 style={{ fontSize: 20 }}>The shows</h2>
            </div>
            <div className="pshows">
              {(shows ?? []).map((item) => (
                <Link
                  className="pshow linkrow"
                  key={item.slug}
                  href={`/watch/show/${item.slug}`}
                >
                  {item.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.cover_url} alt="" />
                  ) : (
                    <span className="cover navy">{item.name}</span>
                  )}
                  <div>
                    <b>{item.name}</b>
                    <div className="muted small">{item.about}</div>
                    <div className="muted small">
                      {episodesIn(item.slug)}{" "}
                      {episodesIn(item.slug) === 1 ? "episode" : "episodes"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>
              {show === "episode" ? "Latest episodes" : "Latest"}
            </h2>
          </div>
          {(items ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="g3">
              {(items ?? []).map((item, i) => (
                <article className="card" key={item.id}>
                  <Link href={`/watch/${item.slug}`}>
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {item.title}
                    </div>
                    <div className="kind">
                      {kindLabel[item.kind] ?? item.kind}
                      {item.duration ? `, ${item.duration}` : ""}
                    </div>
                    <p>{item.summary}</p>
                    {item.member_only ? (
                      <div className="meta">
                        <span className="chip">Members only</span>
                      </div>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
            </PageBlocks>
</DualPage>
        );
}
'@
Write-File "app\watch\page.tsx" $f11

$f12 = @'
import { DualPage } from "@/components/dual-page";
import { PageBlocks } from "@/components/page-blocks";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

export const metadata = {
  title: "Members, ExpatPreneurs Global",
  description:
    "Members who chose to be listed publicly, across every Village.",
};

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

export default async function PublicMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ village?: string; q?: string }>;
}) {
  const { village = "", q = "" } = await searchParams;
  const supabase = await createClient();
  const me = await whoIsHere();

  const [{ data: villages }, { data: everyone }] = await Promise.all([
    supabase.from("villages").select("id, slug, name").order("name"),
    supabase
      .from("profiles")
      .select(
        "id, full_name, headline, business_name, industry, lived_in, village_id, avatar_url"
      )
      .eq("public_profile", true)
      .eq("status", "active")
      .order("full_name")
      .limit(200),
  ]);

  const villageId = villages?.find((v) => v.slug === village)?.id ?? null;

  const people = (everyone ?? []).filter((person) => {
    if (villageId && person.village_id !== villageId) return false;
    if (!q) return true;
    const hay = [
      person.full_name,
      person.headline,
      person.business_name,
      person.industry,
      ...(person.lived_in ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <DualPage member={Boolean(me)} nav="/directory" active="/members">
      <PageBlocks data={{ people: people ?? [] }} slug="members">
        <section className={me ? "sec" : "pubsec hero-center"}>
          <h1>Members</h1>
          <p className="lead">
            People building a business away from home, in every Village. These
            are the members who chose to be listed publicly.
          </p>

          <form className="searchrow" action="/members" style={{ marginTop: 18 }}>
            {village ? <input type="hidden" name="village" value={village} /> : null}
            <input
              name="q"
              defaultValue={q}
              placeholder="An industry, a market, a name"
              aria-label="Search members"
            />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>

          <div className="tabs">
            <Link
              className={`chip ${village ? "" : "chip-mint"}`}
              href={`/members${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            >
              Everywhere
            </Link>
            {(villages ?? []).map((v) => (
              <Link
                className={`chip ${village === v.slug ? "chip-mint" : ""}`}
                href={`/members?village=${v.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                key={v.id}
              >
                {v.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="sec">
          {people.length === 0 ? (
            <p className="muted">
              Nobody matches that yet. Most members keep their profile inside
              the platform, which is their choice to make.
            </p>
          ) : (
            <div className="g3 g4">
              {people.map((person, i) => (
                <Link className="card" href={`/members/${person.id}`} key={person.id}>
                  {person.avatar_url ? (
                    <div className="cover photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.avatar_url} alt="" />
                    </div>
                  ) : (
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {person.full_name
                        .split(" ")
                        .map((part: string) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="kind">
                    {person.industry ?? person.business_name ?? ""}
                  </div>
                  <p>
                    <b>{person.full_name}</b>
                    {person.headline ? `. ${person.headline}` : ""}
                  </p>
                  <div className="meta">
                    <span className="chip">{villageName(person.village_id)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {me ? null : (
          <section className="sec">
            <h2>Members see more than this</h2>
            <p className="lead">
              What somebody is looking for, what they can help with, and how to
              reach them stay inside the platform.
            </p>
            <p>
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>{" "}
              <Link className="btn btn-ghost" href="/membership">
                What membership costs
              </Link>
            </p>
          </section>
        )}
            </PageBlocks>
</DualPage>
  );
}
'@
Write-File "app\members\page.tsx" $f12

$f13 = @'
import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { ContactForm } from "./form";

export const metadata = { title: "Contact, ExpatPreneurs Global" };

const TABS: [string, string][] = [
  ["general", "General"],
  ["partnership", "Partnerships"],
  ["press", "Press"],
];

const HEADINGS: Record<string, [string, string]> = {
  general: [
    "Contact us",
    "Questions about membership or a Village? We usually reply within two working days.",
  ],
  partnership: [
    "Partner with ExpatPreneurs",
    "Sponsors, venues and organisations who want to support expat founders. Partnerships are agreed with the Global team.",
  ],
  press: ["Press and media", "Interviews, stories and speaking requests."],
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "general" } = await searchParams;
  const here = HEADINGS[kind] ? kind : "general";
  const [title, intro] = HEADINGS[here];

  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name")
    .order("name");

  return (
    <PublicPage active="/contact">
      <PageBlocks slug="contact">
      <section className="pubsec">
        <div className="article" style={{ maxWidth: 680 }}>
          <h2>{title}</h2>
          <p className="intro">{intro}</p>

          <div className="tabs" style={{ marginTop: 18 }}>
            {TABS.map(([key, label]) => (
              <Link
                key={key}
                href={`/contact?kind=${key}`}
                aria-current={here === key ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <ContactForm kind={here} villages={villages ?? []} />
          </div>

          <div className="g3" style={{ marginTop: 22 }}>
            <Link className="panel" href="/apply">
              <h3 style={{ fontSize: 14 }}>You want to join</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Requesting an invitation is the way in, and it is read by a
                person.
              </p>
            </Link>
            <Link className="panel" href="/villages/suggest">
              <h3 style={{ fontSize: 14 }}>Your city is not here</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Villages open where enough people ask.
              </p>
            </Link>
            <Link className="panel" href="/apply/status">
              <h3 style={{ fontSize: 14 }}>You already applied</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Your reference and email show you where it stands.
              </p>
            </Link>
          </div>
        </div>
      </section>
          </PageBlocks>
</PublicPage>
  );
}
'@
Write-File "app\contact\page.tsx" $f13

$f14 = @'
import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { ApplyForm } from "./form";

export const metadata = { title: "Request an invitation, ExpatPreneurs Global" };

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching"])
    .order("name");

  return (
    <PublicPage>
      <PageBlocks slug="apply">
      <main className="wrap">
        <section className="sec">
          <h1>Request an invitation</h1>
          <p className="lead">
            Every request is read personally. Tell us about you, your business
            and where your journey has taken you.
          </p>
          <p className="muted small">
            Already asked? <Link href="/apply/status">Check where it stands</Link>.
          </p>
        </section>
        <section className="sec">
          <ApplyForm villages={villages ?? []} />
        </section>
      </main>
          </PageBlocks>
</PublicPage>
  );
}
'@
Write-File "app\apply\page.tsx" $f14

$f15 = @'
-- The last ten public pages, as blocks.
--
-- Discover, Villages, Events, Businesses, Learning, Media, Watch and
-- Listen, Members, Contact and the invitation form. Each is its own
-- page in the prototype, written out as the blocks that make it.
--
-- All drafts, so nothing on the site changes until each is published.
-- A page with filters, tabs or a form keeps the coded version until
-- then, and the form blocks point at the real form rather than
-- pretending to be one.


insert into pages (slug, title, path, status, blocks)
values ('discover', 'Discover', '/discover', 'draft', '[
 {
  "type": "hero",
  "layout": "center",
  "heading": "Wherever you have landed, there is a Village for you",
  "text": "Find the Villages, Circles and people building a business away from home.",
  "art": ""
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "people",
  "heading": "Members you will meet",
  "limit": "6",
  "more_href": "/members"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "ExpatPreneurs grows through introductions.",
  "text": "Know someone who belongs here?",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 },
 {
  "type": "events",
  "heading": "Events",
  "limit": "4",
  "more_href": "/events"
 },
 {
  "type": "courses",
  "heading": "Learning",
  "limit": "4",
  "more_href": "/learning"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "4",
  "more_href": "/businesses"
 },
 {
  "type": "videos",
  "heading": "Watch and listen",
  "limit": "4",
  "more_href": "/watch"
 },
 {
  "type": "band",
  "tone": "navy",
  "heading": "Lisbon and Paris open next month.",
  "text": "Madrid is being explored.",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('villages', 'Villages', '/villages', 'draft', '[
 {
  "type": "heading",
  "heading": "Find your Village",
  "text": "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network."
 },
 {
  "type": "villages"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "No Village in your city yet?",
  "body": "Tell us where you are. New Villages open when there are enough members and trusted people ready to host them.",
  "button_label": "Suggest your city",
  "button_href": "/villages/suggest"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('events', 'Events', '/events', 'draft', '[
 {
  "type": "heading",
  "heading": "Events",
  "text": "Gatherings in every Village and online. Some are open to everyone; most are for members."
 },
 {
  "type": "events",
  "limit": "20"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('businesses', 'Businesses', '/businesses', 'draft', '[
 {
  "type": "heading",
  "heading": "Businesses in the network",
  "text": "Services and offers from members in every Village. Contact them directly."
 },
 {
  "type": "businesses",
  "limit": "24"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Run a business abroad?",
  "text": "Members can list their business here once approved.",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('learning', 'Learning', '/learning', 'draft', '[
 {
  "type": "heading",
  "heading": "Learning",
  "text": "Short, practical and actionable workshops from founders in the network."
 },
 {
  "type": "courses",
  "limit": "24"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "Teach in the network",
  "body": "Paid members can apply to become educators and earn from their workshops.",
  "button_label": "See membership",
  "button_href": "/membership"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('media', 'Media', '/media', 'draft', '[
 {
  "type": "heading",
  "heading": "Media",
  "text": "Stories and knowledge from the people building across the network."
 },
 {
  "type": "articles",
  "limit": "12"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "The monthly newsletter",
  "body": "New stories, guides and events from every Village.",
  "button_label": "Watch and Listen",
  "button_href": "/watch"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('watch', 'Watch and Listen', '/watch', 'draft', '[
 {
  "type": "heading",
  "heading": "Watch and Listen",
  "text": "Videos and podcast episodes chosen by the ExpatPreneurs Media team, from our own channel and from members building across the network."
 },
 {
  "type": "videos",
  "heading": "Videos",
  "kind": "video",
  "limit": "8",
  "more_href": "/watch"
 },
 {
  "type": "shows",
  "heading": "The shows"
 },
 {
  "type": "videos",
  "heading": "Latest episodes",
  "kind": "episode",
  "limit": "6"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('members', 'Members', '/members', 'draft', '[
 {
  "type": "heading",
  "heading": "Meet the members",
  "text": "Founders who chose to be listed publicly. Members see more, and can connect."
 },
 {
  "type": "people",
  "limit": "24"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Want to connect?",
  "text": "Members can message and meet each other.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Log in",
  "second_href": "/login"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('contact', 'Contact', '/contact', 'draft', '[
 {
  "type": "heading",
  "heading": "Contact us",
  "text": "Questions about membership or a Village? We usually reply within two working days."
 },
 {
  "type": "form",
  "which": "contact",
  "heading": "Send us a message"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('apply', 'Request an invitation', '/apply', 'draft', '[
 {
  "type": "heading",
  "heading": "Request your invitation",
  "text": "ExpatPreneurs is by invitation only. Every person starting a business in a country that is not their original country is an ExpatPreneur, at any stage: idea, scaling or expansion. It takes about ten minutes."
 },
 {
  "type": "steps",
  "heading": "What happens next",
  "items": "Review | Your request is read personally.\\nA conversation | We may ask a few questions or invite you to an open evening.\\nWelcome | Once accepted, you complete your profile and join a Circle and its WhatsApp group."
 },
 {
  "type": "form",
  "which": "apply",
  "heading": "The form itself"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();
'@
Write-File "supabase\migrations\0051_public_pages_as_blocks.sql" $f15

git add app components lib supabase
git commit -m "The last ten public pages as blocks, with four new block types"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0051_public_pages_as_blocks.sql"
    Write-Host ""
    Write-Host "Then: Global team, Content, Pages. All fifteen pages are there."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
