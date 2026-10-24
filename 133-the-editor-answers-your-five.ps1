# 133-the-editor-answers-your-five.ps1
# Your five points. One migration, 0049 again, because the hero gained
# a setting: 0049_home_page_blocks.sql.
#
# 1. The panel scrolls. It was pinned with no height, so anything past
#    the fold was unreachable. It now has a height and its own scroll,
#    and it stays beside the canvas.
#
# 2. Pictures. Every picture field takes an upload or a pasted address,
#    and the address box shows what is currently set so you can see and
#    replace it. The Villages block has no picture because its pictures
#    come from each Village; those are changed in Global team, Villages.
#
# 3. Links are chosen, not typed. Every "goes to" is a dropdown of the
#    twenty public addresses, with "Somewhere else" if you want a full
#    address of your own.
#
# 4. The hero's right-hand side is a setting on the hero now: the
#    preview panel with the profile, the event and the cities, or a
#    photograph, or nothing. The seeded home page says preview, which
#    is what the prototype has.
#
# 5. Style. Every block, not just some, now has a Style tab beside
#    Content: width, centred or left, how much space around it,
#    background colour, text colour, heading size and rounded corners.
#    The colours are the brand palette as swatches, with a picker for
#    anything else.
#
# On Elementor: I am not going to tell you this is Elementor. Elementor
# is years of work by a company, with a canvas that edits any element,
# breakpoint controls, a widget marketplace and its own rendering
# engine. What this is, honestly: your prototype's sections as blocks,
# arrangeable and restyleable without code, which is the thing you
# actually need in order to hand the site over. If a specific Elementor
# behaviour matters to you, name it and I will build that behaviour.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\lib\blocks.ts
#   C:\Users\HP\Desktop\expatpreneur\components\blocks.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\page-builder.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\content\actions.ts
#   C:\Users\HP\Desktop\expatpreneur\app\forms.css
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0049_home_page_blocks.sql
#
#   powershell -ExecutionPolicy Bypass -File .\133-the-editor-answers-your-five.ps1

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
        ) : b.art === "preview" || b.art === undefined ? (
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
Write-File "components\blocks.tsx" $f1

$f2 = @'
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
Write-File "components\page-builder.tsx" $f2

$f3 = @'
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
        // A colour of their own is kept alongside the choice.
        const own = String(b[`${f.name}_custom`] ?? "").trim();
        if (own) out[`${f.name}_custom`] = own;
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
Write-File "app\global\content\actions.ts" $f3

$f4 = @'
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
'@
Write-File "app\forms.css" $f4

$f5 = @'
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
  "art": "preview",
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
  "art": "preview",
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
Write-File "supabase\migrations\0049_home_page_blocks.sql" $f5

git add app components lib supabase
git commit -m "Scrolling panel, chosen links, the hero panel, and style on every block"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase again, for the hero setting:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0049_home_page_blocks.sql"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
