# 139-patterns-addons-menus-and-the-drag-that-did-not-work.ps1
# Your four. One migration: 0052_menus.sql.
#
# The cards would not drag, and you were right. The drag starts on the
# block, so the thing under your pointer was never what the code was
# looking at: it asked what was clicked, and the answer was always the
# block. It now asks what is under the pointer, at the moment you pick
# up and at the moment you let go, and the card you are about to drop
# onto lights up. Dubai in front of Madrid works.
#
# Ready made sections. Thirteen of them, grouped: openings, explaining,
# proof, live content, closings. Add a section opens on those, with one
# block behind a second tab. A section is only blocks, so the moment it
# lands you can edit, restyle, reorder or pull it apart.
#
# Addons, as blocks that do a job rather than a shape: space or a line,
# a row of up to three buttons, a video from YouTube or Vimeo by its
# address, and a ticked list. Twenty eight block types now, all of them
# with their own parts and their own per screen styling.
#
# And your question, which nothing had answered: a new page was
# unreachable. Global team, Content, Menus. Seven menus, the header and
# the six footer columns. Each link says what it says, where it goes,
# chosen from the pages that exist plus the rest of the site, and who
# sees it: everybody, only signed out people, or only members. The
# header reads that menu and falls back to the five links in the code
# if nobody has made one, so nothing breaks in the meantime. A draft
# page appears in the list marked as a draft, so the link can be set up
# before the page goes live.
#
# Full paths for this script:
#   C:\\Users\\HP\\Desktop\\expatpreneur\\lib\\blocks.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\lib\\patterns.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\lib\\menus.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\blocks.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\page-builder.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\site-header.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\components\\spaces.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\global\\menus\\page.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\global\\menus\\forms.tsx
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\global\\menus\\actions.ts
#   C:\\Users\\HP\\Desktop\\expatpreneur\\app\\forms.css
#   C:\\Users\\HP\\Desktop\\expatpreneur\\supabase\\migrations\\0052_menus.sql
#
#   powershell -ExecutionPolicy Bypass -File .\139-patterns-addons-menus-and-the-drag-that-did-not-work.ps1

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

// The three widths a page is looked at. A style setting can be given a
// different value on each, and a device with nothing set inherits the
// one above it.
export const DEVICES: [string, string, number][] = [
  ["", "Desktop", 0],
  ["md", "Tablet", 834],
  ["sm", "Phone", 390],
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
  S("hide", "On this screen", [["", "Show it"], ["1", "Hide it"]]),
];

// Which style settings can differ per screen. Colours stay the same
// everywhere, because a block that changes colour on a phone is
// almost always a mistake.
export const PER_DEVICE = ["width", "align", "space", "size", "hide"];

// The value of a setting on one device, falling back up the sizes.
export function styleOf(block: Record<string, string | undefined>, name: string, device: string) {
  if (!device) return block[name];
  if (device === "md") return block[`${name}_md`] ?? block[name];
  return block[`${name}_sm`] ?? block[`${name}_md`] ?? block[name];
}


// heading_tablet, space_phone and so on.
export const forDevice = (name: string, device: string) =>
  device ? `${name}_${device}` : name;
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
    type: "columns",
    label: "Columns",
    about: "A row of columns. Any block can be dropped into one, and they can be dragged between columns.",
    fields: [
      S("count", "How many columns", [["2", "Two"], ["3", "Three"], ["4", "Four"]]),
      S("gap", "Space between", [["", "Normal"], ["tight", "Tight"], ["roomy", "Roomy"]]),
      S("stack", "On a phone", [["", "One under the other"], ["keep", "Keep side by side"]]),
    ],
  },
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
      T("search", "Search box", "Wording inside a search box under the heading. Leave empty for none."),
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
      S("filters", "Filter row", [["", "No filters"], ["village", "By Village"], ["when", "By when"]]),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "businesses",
    label: "Businesses",
    about: "Member businesses, from the database.",
    fields: [
      T("heading", "Heading"),
      N("limit", "How many"),
      S("filters", "Filter row", [["", "No filters"], ["category", "By category"]]),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "courses",
    label: "Learning",
    about: "Courses, from the database.",
    fields: [
      T("heading", "Heading"),
      N("limit", "How many"),
      S("filters", "Filter row", [["", "No filters"], ["format", "Live or recorded"]]),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "articles",
    label: "Stories",
    about: "Published articles, from the database.",
    fields: [
      T("heading", "Heading"),
      N("limit", "How many"),
      S("filters", "Filter row", [["", "No filters"], ["kind", "By kind"]]),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "people",
    label: "Members",
    about: "Member cards, from the database. Only members who chose to be listed.",
    fields: [
      T("heading", "Heading"),
      N("limit", "How many"),
      S("filters", "Filter row", [["", "No filters"], ["industry", "By industry"]]),
      K("more_href", "See all goes to"),
    ],
  },
  {
    type: "videos",
    label: "Videos and episodes",
    about: "What is in Watch and Listen, from the database.",
    fields: [
      T("heading", "Heading"),
      S("kind", "Which", [["", "Everything"], ["video", "Videos"], ["episode", "Podcast episodes"]]),
      N("limit", "How many"),
      S("filters", "Filter row", [["", "No filters"], ["kind", "Videos or episodes"]]),
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
    type: "divider",
    label: "Space or a line",
    about: "A gap, or a line across the page.",
    fields: [
      N("height", "Height in pixels"),
      S("line", "A line", [["", "No line"], ["1", "Yes"]]),
    ],
  },
  {
    type: "buttons",
    label: "Buttons",
    about: "One to three buttons in a row.",
    fields: [
      T("label_1", "First button"),
      K("href_1", "It goes to"),
      T("label_2", "Second button"),
      K("href_2", "It goes to"),
      T("label_3", "Third button"),
      K("href_3", "It goes to"),
      S("look", "Look", [["", "First one filled"], ["all", "All filled"], ["plain", "All plain"]]),
    ],
  },
  {
    type: "embed",
    label: "A video from elsewhere",
    about: "A YouTube or Vimeo video, by its address.",
    fields: [U("url", "Address of the video"), T("caption", "Caption")],
  },
  {
    type: "ticks",
    label: "A list with ticks",
    about: "The ticked list the prototype uses for what is included.",
    fields: [T("heading", "Heading"), L("items", "One per line")],
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
// A list block can be given its own order, as the names of its rows.
// Anything not named keeps its usual place at the end.
export function inOrder<T extends { slug?: string; id?: string }>(
  rows: T[],
  order?: string
): T[] {
  const want = String(order ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!want.length) return rows;
  const key = (r: T) => r.slug ?? r.id ?? "";
  const named = want.map((w) => rows.find((r) => key(r) === w)).filter(Boolean) as T[];
  const rest = rows.filter((r) => !want.includes(key(r)));
  return [...named, ...rest];
}

export const blockSpec = (type: string) => {
  const b = BLOCKS.find((x) => x.type === type);
  return b ? { ...b, fields: [...b.fields, ...STYLE_FIELDS] } : undefined;
};
export const blockLabel: Record<string, string> = Object.fromEntries(
  BLOCKS.map((b) => [b.type, b.label])
);

// A block is its type plus whatever its fields hold.
export type Block = { type: string } & Record<string, string | undefined>;

// A container holds children. They are kept as text on the block, so
// everything that already reads and writes a block keeps working.
export const isContainer = (type: string) => type === "columns";

export function kidsOf(block: Block): Block[][] {
  try {
    const parsed = JSON.parse(block.kids ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const withKids = (block: Block, kids: Block[][]): Block => ({
  ...block,
  kids: JSON.stringify(kids),
});

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


// ===== Elements =====
//
// A block is made of parts: a heading, a paragraph, a button, a card.
// Each part can be styled on its own, on each screen, without touching
// the others. A part with nothing set looks exactly as the design says.

export type ElementSpec = { name: string; label: string };

export const ELEMENTS: Record<string, ElementSpec[]> = {
  columns: [{ name: "col", label: "Each column" }],
  divider: [{ name: "line", label: "The line" }],
  buttons: [{ name: "button", label: "Each button" }],
  embed: [{ name: "frame", label: "The video" }, { name: "caption", label: "Caption" }],
  ticks: [{ name: "heading", label: "Heading" }, { name: "item", label: "Each line" }],
  hero: [
    { name: "heading", label: "Heading" },
    { name: "text", label: "Paragraph" },
    { name: "button", label: "First button" },
    { name: "button2", label: "Second button" },
    { name: "quote", label: "Line in the margin" },
    { name: "search", label: "Search box" },
  ],
  heading: [
    { name: "heading", label: "Heading" },
    { name: "text", label: "Line underneath" },
  ],
  text: [{ name: "body", label: "The text" }],
  panel: [
    { name: "box", label: "The box" },
    { name: "heading", label: "Heading" },
    { name: "body", label: "Text" },
    { name: "button", label: "Button" },
  ],
  band: [
    { name: "box", label: "The strip" },
    { name: "heading", label: "Heading" },
    { name: "text", label: "Line underneath" },
    { name: "button", label: "Button" },
    { name: "button2", label: "Second button" },
  ],
  image: [{ name: "image", label: "The photograph" }, { name: "caption", label: "Caption" }],
  stats: [{ name: "box", label: "Each figure" }, { name: "label", label: "Labels" }, { name: "value", label: "Figures" }],
  steps: [{ name: "heading", label: "Heading" }, { name: "num", label: "The numbers" }, { name: "title", label: "Step headings" }, { name: "text", label: "Step text" }],
  features: [{ name: "heading", label: "Heading" }, { name: "box", label: "Each card" }, { name: "title", label: "Card headings" }, { name: "text", label: "Card text" }],
  faq: [{ name: "heading", label: "Heading" }, { name: "q", label: "Questions" }, { name: "a", label: "Answers" }],
  quotes: [{ name: "heading", label: "Heading" }, { name: "box", label: "Each quote" }, { name: "quote", label: "The words" }, { name: "who", label: "Who said it" }],
  layers: [{ name: "heading", label: "Heading" }, { name: "text", label: "Line underneath" }, { name: "box", label: "Each layer" }, { name: "title", label: "Layer names" }],
  villages: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each card" }],
  events: [{ name: "heading", label: "Heading" }, { name: "row", label: "Each row" }],
  businesses: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each card" }],
  courses: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each card" }],
  articles: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each card" }],
  people: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each card" }],
  videos: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each item" }],
  shows: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each show" }],
  story: [{ name: "box", label: "The panel" }, { name: "heading", label: "Heading" }, { name: "body", label: "Text" }, { name: "image", label: "Photograph" }],
  plans: [{ name: "heading", label: "Heading" }, { name: "card", label: "Each plan" }, { name: "price", label: "The price" }],
  form: [{ name: "box", label: "The box" }, { name: "heading", label: "Heading" }, { name: "button", label: "Button" }],
};

// What can be set on a part. Everything here can differ per screen.
export const ELEMENT_FIELDS: BlockField[] = [
  { name: "color", label: "Text colour", kind: "colour" },
  { name: "bg", label: "Background", kind: "colour" },
  { name: "size", label: "Text size in pixels", kind: "number" },
  {
    name: "weight",
    label: "Weight",
    kind: "select",
    options: [["", "As designed"], ["400", "Regular"], ["600", "Medium"], ["700", "Bold"], ["800", "Heavy"]],
  },
  {
    name: "align",
    label: "Alignment",
    kind: "select",
    options: [["", "As designed"], ["left", "Left"], ["center", "Centred"], ["right", "Right"]],
  },
  { name: "lh", label: "Line height", kind: "text", hint: "For example 1.4" },
  { name: "ls", label: "Letter spacing", kind: "text", hint: "For example -0.02em" },
  { name: "pad", label: "Padding", kind: "text", hint: "For example 16px, or 16px 24px" },
  { name: "mt", label: "Space above in pixels", kind: "number" },
  { name: "mb", label: "Space below in pixels", kind: "number" },
  { name: "radius", label: "Corner radius in pixels", kind: "number" },
  { name: "border", label: "Border", kind: "text", hint: "For example 1px solid #E3E6EA" },
  { name: "maxw", label: "Largest width in pixels", kind: "number" },
  { name: "hide", label: "On this screen", kind: "select", options: [["", "Show it"], ["1", "Hide it"]] },
];

// Element settings live under one flat key, so they save and load with
// everything else: el.heading.size, el.heading.size_sm and so on.
export const elKey = (el: string, name: string, device = "") =>
  `el.${el}.${name}${device ? `_${device}` : ""}`;

export function elementOf(
  block: Record<string, string | undefined>,
  el: string,
  name: string,
  device: string
) {
  if (!device) return block[elKey(el, name)];
  if (device === "md") return block[elKey(el, name, "md")] ?? block[elKey(el, name)];
  return (
    block[elKey(el, name, "sm")] ??
    block[elKey(el, name, "md")] ??
    block[elKey(el, name)]
  );
}

// The CSS for one part, on one screen.
export function elementCss(
  block: Record<string, string | undefined>,
  el: string,
  device: string
) {
  const g = (n: string) => elementOf(block, el, n, device);
  const out: string[] = [];
  const colour = (v?: string) => (v === "custom" ? undefined : v);

  const color = colour(g("color")) ?? (g("color") === "custom" ? g("color_custom") : undefined);
  const bg = colour(g("bg")) ?? (g("bg") === "custom" ? g("bg_custom") : undefined);

  if (color) out.push(`color:${color}`);
  if (bg) out.push(`background:${bg}`);
  if (g("size")) out.push(`font-size:${g("size")}px`);
  if (g("weight")) out.push(`font-weight:${g("weight")}`);
  if (g("align")) out.push(`text-align:${g("align")}`);
  if (g("lh")) out.push(`line-height:${g("lh")}`);
  if (g("ls")) out.push(`letter-spacing:${g("ls")}`);
  if (g("pad")) out.push(`padding:${g("pad")}`);
  if (g("mt")) out.push(`margin-top:${g("mt")}px`);
  if (g("mb")) out.push(`margin-bottom:${g("mb")}px`);
  if (g("radius")) out.push(`border-radius:${g("radius")}px`);
  if (g("border")) out.push(`border:${g("border")}`);
  if (g("maxw")) out.push(`max-width:${g("maxw")}px`);
  if (g("hide") === "1") out.push("display:none");
  return out.join(";");
}

// Which parts of a block have been given something.
export function touchedElements(block: Record<string, string | undefined>) {
  const names = new Set<string>();
  for (const k of Object.keys(block))
    if (k.startsWith("el.")) names.add(k.split(".")[1]);
  return [...names];
}
'@
Write-File "lib\blocks.ts" $f0

$f1 = @'
import type { Block } from "@/lib/blocks";

// Ready made sections. Each one is a small arrangement of blocks that
// somebody can drop onto a page and then edit like anything else.
// Nothing here is special: a pattern is only blocks.

export type Pattern = {
  name: string;
  about: string;
  group: string;
  blocks: Block[];
};

const cols = (count: string, kids: Block[][], extra: Record<string, string> = {}): Block => ({
  type: "columns",
  count,
  kids: JSON.stringify(kids),
  ...extra,
});

export const PATTERNS: Pattern[] = [
  {
    name: "Opening, words and picture",
    about: "A heading and a paragraph beside a photograph.",
    group: "Openings",
    blocks: [
      cols("2", [
        [
          { type: "heading", heading: "A heading that says what this is" },
          { type: "text", body: "Two or three sentences underneath, saying who it is for." },
          { type: "panel", heading: "", body: "", button_label: "Request your invitation", button_href: "/apply" },
        ],
        [{ type: "image", height: "360" }],
      ]),
    ],
  },
  {
    name: "Opening, centred",
    about: "A centred heading, a paragraph and two buttons.",
    group: "Openings",
    blocks: [
      {
        type: "hero",
        layout: "center",
        art: "",
        heading: "A heading in the middle",
        text: "One sentence that explains it.",
        button_label: "Request your invitation",
        button_href: "/apply",
        second_label: "How it works",
        second_href: "/how-it-works",
      },
    ],
  },
  {
    name: "Three things",
    about: "Three cards across, with a heading above them.",
    group: "Explaining",
    blocks: [
      {
        type: "features",
        heading: "Three things worth knowing",
        columns: "3",
        items:
          "The first | What it means and why it matters.\nThe second | What it means and why it matters.\nThe third | What it means and why it matters.",
      },
    ],
  },
  {
    name: "Numbers that matter",
    about: "Four figures side by side.",
    group: "Explaining",
    blocks: [
      {
        type: "stats",
        label_1: "Members",
        value_1: "73",
        label_2: "Villages",
        value_2: "3",
        label_3: "Nationalities",
        value_3: "23",
        label_4: "Circles",
        value_4: "2",
      },
    ],
  },
  {
    name: "How it goes, step by step",
    about: "A numbered path across the page.",
    group: "Explaining",
    blocks: [
      {
        type: "steps",
        heading: "How it goes",
        items:
          "Ask | Tell us about yourself.\nWe read it | Every request is read personally.\nWelcome | You are placed in a Circle.",
      },
    ],
  },
  {
    name: "Text beside questions",
    about: "A column of prose with the questions people ask beside it.",
    group: "Explaining",
    blocks: [
      cols("2", [
        [{ type: "text", body: "## Why this exists\\nA paragraph about it." }],
        [
          {
            type: "faq",
            heading: "Questions",
            items:
              "The first question? | The answer.\nThe second question? | The answer.",
          },
        ],
      ]),
    ],
  },
  {
    name: "What members say",
    about: "Three quotes across the page.",
    group: "Proof",
    blocks: [
      {
        type: "quotes",
        heading: "What members say",
        items:
          "It changed how I work. | A member, Dubai\nI found my first client here. | A member, Lisbon\nWorth every minute. | A member, Paris",
      },
    ],
  },
  {
    name: "One story, pulled out",
    about: "A featured story in the pink panel.",
    group: "Proof",
    blocks: [
      {
        type: "story",
        heading: "The story worth reading first",
        body: "A sentence about why.",
        button_href: "/media",
      },
    ],
  },
  {
    name: "Members and businesses",
    about: "Members on one side, businesses on the other.",
    group: "Proof",
    blocks: [
      cols("2", [
        [{ type: "people", heading: "Members", limit: "4" }],
        [{ type: "businesses", heading: "Businesses", limit: "4" }],
      ]),
    ],
  },
  {
    name: "What is coming up",
    about: "Events with their filters, and a panel beside them.",
    group: "Live content",
    blocks: [
      cols("2", [
        [{ type: "events", heading: "Coming up", limit: "6", filters: "village" }],
        [
          {
            type: "panel",
            tone: "wash",
            heading: "Not a member yet?",
            body: "Some events are open to everyone.",
            button_label: "Request your invitation",
            button_href: "/apply",
          },
        ],
      ]),
    ],
  },
  {
    name: "Learning and stories",
    about: "Courses above, articles below.",
    group: "Live content",
    blocks: [
      { type: "courses", heading: "Learning", limit: "3", more_href: "/learning" },
      { type: "articles", heading: "Stories", limit: "3", more_href: "/media" },
    ],
  },
  {
    name: "Closing band",
    about: "The wide strip with a heading and a button.",
    group: "Closing",
    blocks: [
      {
        type: "band",
        tone: "blue",
        heading: "Ready to find your Village?",
        text: "ExpatPreneurs is by invitation.",
        button_label: "Request your invitation",
        button_href: "/apply",
      },
    ],
  },
  {
    name: "Closing, with the form",
    about: "A short line and a route to a form.",
    group: "Closing",
    blocks: [
      cols("2", [
        [
          { type: "heading", heading: "Get in touch", text: "We reply within two working days." },
        ],
        [{ type: "form", which: "contact", heading: "Send us a message" }],
      ]),
    ],
  },
];

export const PATTERN_GROUPS = [...new Set(PATTERNS.map((p) => p.group))];
'@
Write-File "lib\patterns.ts" $f1

$f2 = @'
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type MenuItem = {
  label: string;
  href: string;
  new_tab?: boolean;
  signed_in?: string;
};

// A menu from the database, or nothing, in which case whatever calls
// this keeps the menu written in the code.
export const menu = cache(async function menu(name: string): Promise<MenuItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("menu_items")
      .select("label, href, new_tab, signed_in")
      .eq("menu", name)
      .order("position");
    return data ?? [];
  } catch {
    return [];
  }
});

// Whether an item should be shown to this person.
export const forWho = (items: MenuItem[], signedIn: boolean) =>
  items.filter(
    (i) =>
      !i.signed_in ||
      i.signed_in === "anyone" ||
      (i.signed_in === "members") === signedIn
  );
'@
Write-File "lib\menus.ts" $f2

$f3 = @'
import Link from "next/link";
import {
  pairs,
  styleOf,
  elementCss,
  touchedElements,
  inOrder,
  kidsOf,
  type Block,
} from "@/lib/blocks";
import { toHtml } from "@/components/rich-text";
import { VillageCard, BusinessCard, CourseCard, ArticleCard, type BusinessRow } from "@/components/cards";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
import { Filtered, Searchable } from "@/components/filtered";
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
    cover_url?: string | null; visibility?: string; village_name?: string | null;
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
const WIDE: Record<string, string> = { narrow: "720px", wide: "none" };

// The settings every block carries, written as real CSS with the two
// breakpoints, so a block can sit differently on a phone than on a
// desktop. A block with nothing set writes no CSS at all.
function rules(b: Block, device: string) {
  const get = (name: string) => styleOf(b, name, device);
  const out: string[] = [];
  const inner: string[] = [];

  if (get("space")) out.push(`padding:${SPACE[get("space") as string]}`);
  if (get("align") === "center") out.push("text-align:center");
  if (get("size")) out.push(`font-size:${SIZE[get("size") as string]}`);
  if (get("hide") === "1") out.push("display:none");

  const w = get("width");
  if (w) inner.push(`max-width:${WIDE[w as string]};margin-left:auto;margin-right:auto`);

  return { out: out.join(";"), inner: inner.join(";") };
}

function Styled({ block: b, children }: { block: Block; children: React.ReactNode }) {
  const bg = b.bg === "custom" ? b.bg_custom : b.bg;
  const ink = b.ink === "custom" ? b.ink_custom : b.ink;

  const base = rules(b, "");
  const tablet = rules(b, "md");
  const phone = rules(b, "sm");

  const plain =
    !bg && !ink && !base.out && !base.inner &&
    !tablet.out && !tablet.inner && !phone.out && !phone.inner &&
    !b.round && !touchedElements(b).length;

  if (plain) return <>{children}</>;

  // One class per block, and the media queries beside it.
  const id = `b${Math.abs(hash(JSON.stringify(b)))}`;
  // The parts of this block that have been styled, on each screen.
  const parts = touchedElements(b);
  const partCss = (device: string) =>
    parts
      .map((el) => {
        const rule = elementCss(b, el, device);
        return rule ? `.${id} [data-el="${el}"]{${rule}}` : "";
      })
      .filter(Boolean)
      .join("");

  const css = [
    `.${id}{${[
      bg ? `background:${bg}` : "",
      ink ? `color:${ink}` : "",
      b.round === "soft" ? "border-radius:18px" : "",
      base.out,
    ].filter(Boolean).join(";")}}`,
    base.inner ? `.${id}>div{${base.inner}}` : "",
    partCss(""),
    tablet.out || tablet.inner || partCss("md")
      ? `@media (max-width:1024px){${tablet.out ? `.${id}{${tablet.out}}` : ""}${
          tablet.inner ? `.${id}>div{${tablet.inner}}` : ""
        }${partCss("md")}}`
      : "",
    phone.out || phone.inner || partCss("sm")
      ? `@media (max-width:620px){${phone.out ? `.${id}{${phone.out}}` : ""}${
          phone.inner ? `.${id}>div{${phone.inner}}` : ""
        }${partCss("sm")}}`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return (
    <div className={`blk ${id} ${ink ? "blk-ink" : ""}`}>
      <style>{css}</style>
      <div>{children}</div>
    </div>
  );
}

// A short, stable name for a block's own rules.
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return h;
}

function PeopleGrid({
  filters,
  people,
}: {
  filters?: string;
  people: { id: string; full_name: string; headline: string | null; industry?: string | null }[];
}) {
  const cards = people.map((p) => (
    <Link className="mcard" data-el="card" data-row={p.id} key={p.id} href={`/members/${p.id}`}>
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
  ));

  if (filters === "industry")
    return <Filtered chips={people.map((p) => p.industry ?? "Other")}>{cards}</Filtered>;

  return <div className="g3">{cards}</div>;
}

function SecHead({ heading, href }: { heading?: string; href?: string }) {
  if (!heading) return null;
  return (
    <div className="sechead">
      <h2 data-el="heading" style={{ fontSize: 20 }}>{heading}</h2>
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
    case "columns": {
      const count = Number(b.count) || 2;
      const kids = kidsOf(b);
      const gap = b.gap === "tight" ? 10 : b.gap === "roomy" ? 34 : 20;
      return (
        <section className="sec">
          <div
            className={`cols ${b.stack === "keep" ? "cols-keep" : ""}`}
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`, gap }}
          >
            {Array.from({ length: count }).map((_, c) => (
              <div className="col" data-el="col" key={c}>
                {(kids[c] ?? []).map((kid, n) => (
                  <Styled block={kid} key={n}>
                    <One block={kid} data={data} />
                  </Styled>
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    }

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
          <h1 data-el="heading">{b.heading}</h1>
          {b.text ? <p className="lead" data-el="text">{b.text}</p> : null}
          {b.button_label || b.second_label ? (
            <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
              {b.button_label ? (
                <Link className="btn btn-primary" data-el="button" href={b.button_href ?? "/apply"}>
                  {b.button_label}
                </Link>
              ) : null}
              {b.second_label ? (
                <Link className="btn btn-ghost" data-el="button2" href={b.second_href ?? "/discover"}>
                  {b.second_label}
                </Link>
              ) : null}
            </div>
          ) : null}
          {b.search ? (
            <label className="input dsearch" data-el="search" style={{ marginTop: 18 }}>
              <input placeholder={b.search} aria-label={b.search} />
            </label>
          ) : null}
          {b.quote ? <p className="proverb" data-el="quote">{b.quote}</p> : null}
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
          <h2 data-el="heading" style={{ fontSize: 20 }}>{b.heading}</h2>
          {b.text ? <p className="intro" data-el="text">{b.text}</p> : null}
        </section>
      );

    case "text":
      return (
        <section className="sec">
          <div
            data-el="body"
            className={b.width === "narrow" ? "article" : ""}
            dangerouslySetInnerHTML={{ __html: toHtml(b.body ?? "") }}
          />
        </section>
      );

    case "panel":
      return (
        <section className="sec">
          <div data-el="box" className={`panel ${b.tone === "wash" ? "panel-wash" : ""}`}>
            {b.heading ? <h3 data-el="heading" style={{ fontSize: 15 }}>{b.heading}</h3> : null}
            {b.body ? (
              <div data-el="body" dangerouslySetInnerHTML={{ __html: toHtml(b.body) }} />
            ) : null}
            {b.button_label ? (
              <Link className="btn btn-ghost btn-sm" data-el="button" href={b.button_href ?? "/"}>
                {b.button_label}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case "band":
      return (
        <section className="sec">
          <div data-el="box" className={`band ${TONES[b.tone ?? ""] ?? ""}`}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 data-el="heading" style={{ fontSize: 22 }}>{b.heading}</h2>
              {b.text ? <p data-el="text" style={{ marginTop: 6 }}>{b.text}</p> : null}
            </div>
            {b.button_label ? (
              <Link className="btn btn-mint" data-el="button" href={b.button_href ?? "/apply"}>
                {b.button_label}
              </Link>
            ) : null}
            {b.second_label ? (
              <Link className="btn btn-ghost" data-el="button2" href={b.second_href ?? "/discover"}>
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
            data-el="image"
            className="photo"
            role="img"
            aria-label={b.caption ?? ""}
            style={{ height: Number(b.height) || 320, backgroundImage: `url('${b.image_url ?? ""}')` }}
          />
          {b.caption ? (
            <p className="muted small" data-el="caption" style={{ marginTop: 8 }}>
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
              <div className="stat" data-el="box" key={label}>
                <span data-el="label">{label}</span>
                <b data-el="value">{value}</b>
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
                <span className="jp-num" data-el="num">{n + 1}</span>
                <div className="jp-body">
                  <h3 data-el="title">{title}</h3>
                  {text ? <p data-el="text">{text}</p> : null}
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
              <div className="panel" data-el="box" key={title}>
                <h3 data-el="title" style={{ fontSize: 14 }}>{title}</h3>
                {text ? (
                  <p className="muted small" data-el="text" style={{ marginTop: 4 }}>
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
                <summary data-el="q">{q}</summary>
                <p data-el="a">{a}</p>
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
              <figure className="quote" data-el="box" key={quote}>
                <blockquote data-el="quote">{quote}</blockquote>
                <figcaption data-el="who">
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
              <div className="layer" data-el="box" key={name}>
                <span className="swatch" style={{ background: swatch[n % 3] }} />
                <h3 data-el="title">{name}</h3>
                <p data-el="text">{text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "villages": {
      const list = inOrder(data.villages ?? [], b.order).filter((v) =>
        b.show === "open" ? v.status === "open" : b.show === "soon" ? v.status !== "open" : true
      );
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((v) => (
              <div data-el="card" data-row={v.slug} key={v.slug}>
                <VillageCard village={v} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "events": {
      let list = inOrder(data.events ?? [], b.order);
      if (b.scope === "public") list = list.filter((e) => e.visibility === "public");
      list = list.slice(0, Number(b.limit) || 4);
      if (!list.length) return null;
      const rows = list.map((e) => {
        const d = new Date(e.starts_at);
        return (
          <EventRow
            wrap="row"
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
      });

      const chips =
        b.filters === "village"
          ? list.map((e) => e.village_name ?? "Online")
          : b.filters === "when"
            ? list.map((e) =>
                new Date(e.starts_at).toLocaleDateString("en-GB", { month: "long" })
              )
            : null;

      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="divide">
            {chips ? <Filtered chips={chips}>{rows}</Filtered> : rows}
          </div>
        </section>
      );
    }

    case "businesses": {
      const list = inOrder(data.businesses ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((x, n) => (
        <div data-el="card" data-row={x.slug} key={x.slug}>
          <BusinessCard biz={x} i={n} />
        </div>
      ));
      const chips = b.filters === "category" ? list.map((x) => x.category ?? x.industry ?? "Other") : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips as string[]}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "courses": {
      const list = inOrder(data.courses ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((c, n) => (
        <div data-el="card" data-row={c.slug} key={c.slug}>
          <CourseCard course={c} i={n} />
        </div>
      ));
      const chips =
        b.filters === "format"
          ? list.map((c) => (c.format === "live" ? "Live" : "Recorded"))
          : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "articles": {
      const list = inOrder(data.articles ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((a, n) => (
        <div data-el="card" data-row={a.slug} key={a.slug}>
          <ArticleCard article={a} i={n} />
        </div>
      ));
      const chips = b.filters === "kind" ? list.map((a) => a.kind ?? "Story") : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "people": {
      const list = inOrder(data.people ?? [], b.order).slice(0, Number(b.limit) || 6);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <PeopleGrid filters={b.filters} people={list} />
        </section>
      );
    }

    case "videos": {
      let list = inOrder(data.media ?? [], b.order);
      if (b.kind) list = list.filter((m) => m.kind === b.kind);
      list = list.slice(0, Number(b.limit) || 8);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="vgrid">
            {list.map((m) => (
              <Link className="vitem" data-el="card" data-row={m.slug} key={m.id} href={`/watch/${m.slug}`}>
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
      const list = inOrder(data.shows ?? [], b.order);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="pshows">
            {list.map((sh) => (
              <Link className="pshow linkrow" data-el="card" data-row={sh.slug} key={sh.slug} href={`/watch/show/${sh.slug}`}>
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

    case "divider":
      return (
        <div
          data-el="line"
          style={{
            height: Number(b.height) || 40,
            borderTop: b.line === "1" ? "1px solid var(--line)" : undefined,
          }}
        />
      );

    case "buttons": {
      const items = [1, 2, 3]
        .map((n) => [b[`label_${n}`], b[`href_${n}`]] as [string | undefined, string | undefined])
        .filter(([label]) => label);
      if (!items.length) return null;
      return (
        <section className="sec">
          <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
            {items.map(([label, href], n) => (
              <Link
                key={label}
                data-el="button"
                className={`btn ${
                  b.look === "all" || (n === 0 && b.look !== "plain")
                    ? "btn-primary"
                    : "btn-ghost"
                }`}
                href={href ?? "/"}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "embed": {
      // YouTube and Vimeo addresses, turned into the address that can
      // be shown on a page.
      const raw = b.url ?? "";
      const yt = raw.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
      const vm = raw.match(/vimeo\.com\/(\d+)/);
      const src = yt
        ? `https://www.youtube.com/embed/${yt[1]}`
        : vm
          ? `https://player.vimeo.com/video/${vm[1]}`
          : "";
      if (!src) return null;
      return (
        <section className="sec">
          <div className="embed" data-el="frame">
            <iframe
              src={src}
              title={b.caption ?? "Video"}
              allowFullScreen
              loading="lazy"
            />
          </div>
          {b.caption ? (
            <p className="muted small" data-el="caption" style={{ marginTop: 8 }}>
              {b.caption}
            </p>
          ) : null}
        </section>
      );
    }

    case "ticks":
      return (
        <section className="sec">
          {b.heading ? <h3 data-el="heading" style={{ fontSize: 15 }}>{b.heading}</h3> : null}
          <ul className="ticks" style={{ marginTop: 10 }}>
            {String(b.items ?? "")
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((l) => (
                <li key={l} data-el="item">
                  <Ic name="check" />
                  <span>{l}</span>
                </li>
              ))}
          </ul>
        </section>
      );

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
          <div className="story" data-el="box">
            <div
              data-el="image"
              className="img"
              role="img"
              aria-label={b.heading ?? ""}
              style={b.image_url ? { backgroundImage: `url('${b.image_url}')` } : undefined}
            />
            <div>
              <h3 data-el="heading" style={{ fontSize: 20, maxWidth: "28ch" }}>{b.heading}</h3>
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
              <div className={`plan2 ${n === list.length - 1 ? "p2-best" : ""}`} data-el="card" key={p.slug}>
                <div className="p2-top">
                  <h3>{p.name}</h3>
                  <span className="p2-tag">{p.blurb}</span>
                </div>
                <div className="p2-price" data-el="price">
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
Write-File "components\blocks.tsx" $f3

$f4 = @'
"use client";

import { useEffect, useState } from "react";
import {
  BLOCKS,
  COLOURS,
  SITE_LINKS,
  STYLE_FIELDS,
  DEVICES,
  PER_DEVICE,
  ELEMENTS,
  ELEMENT_FIELDS,
  elKey,
  isContainer,
  kidsOf,
  withKids,
  touchedElements,
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
import { PATTERNS, PATTERN_GROUPS } from "@/lib/patterns";

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
  const [past, setPast] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [device, setDevice] = useState("");
  const [picked, setPicked] = useState<number | null>(initial.length ? 0 : null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [row, setRow] = useState<{ block: number; name: string } | null>(null);
  const [inside, setInside] = useState<{ block: number; col: number; index: number } | null>(null);
  const [dragKid, setDragKid] = useState<{ block: number; col: number; index: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingTo, setAddingTo] = useState<{ block: number; col: number } | null>(null);
  const [showing, setShowing] = useState<"patterns" | "blocks">("patterns");
  const [tab, setTab] = useState<"content" | "style" | "element">("content");
  const [element, setElement] = useState<string>("");
  const [shut, setShut] = useState(false);
  const [state, setState] = useState<PageState>({});
  const [saving, setSaving] = useState(false);

  // Every change remembers what came before it, so it can be undone.
  const change = (next: Block[]) => {
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
    setState({});
  };

  function undo() {
    setPast((p) => {
      if (!p.length) return p;
      setFuture((f) => [blocks, ...f].slice(0, 50));
      setBlocks(p[p.length - 1]);
      return p.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (!f.length) return f;
      setPast((p) => [...p, blocks]);
      setBlocks(f[0]);
      return f.slice(1);
    });
  }

  useEffect(() => {
    function keys(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || e.key.toLowerCase() !== "z") return;
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

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

  // A ready made section is only blocks, so it is added like any other.
  function addPattern(p: { blocks: Block[] }) {
    const where = picked == null ? blocks.length : picked + 1;
    const next = [...blocks];
    next.splice(where, 0, ...p.blocks.map((b) => ({ ...b })));
    change(next);
    setPicked(where);
    setAdding(false);
    setAddingTo(null);
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

  // A per-screen setting is written under its own name, so the desktop
  // value stays put when the phone one changes.
  function fieldName(name: string) {
    return device && PER_DEVICE.includes(name) ? `${name}_${device}` : name;
  }

  // Element settings carry their own key, already worked out.
  function setRaw(i: number, key: string, value: string) {
    const next = blocks.map((b, n) => (n === i ? { ...b, [key]: value } : b));
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
  }

  function clearElement(i: number, el: string) {
    const next = blocks.map((b, n) => {
      if (n !== i) return b;
      const copy: Block = { ...b };
      for (const k of Object.keys(copy)) if (k.startsWith(`el.${el}.`)) delete copy[k];
      return copy;
    });
    change(next);
  }

  // Children of a container, and the one being edited inside it.
  function setKids(i: number, kids: Block[][]) {
    const next = blocks.map((b, n) => (n === i ? withKids(b, kids) : b));
    change(next);
  }

  function addKid(i: number, col: number, type: string) {
    const kids = kidsOf(blocks[i]);
    while (kids.length <= col) kids.push([]);
    kids[col] = [...(kids[col] ?? []), { type }];
    setKids(i, kids);
    setInside({ block: i, col, index: kids[col].length - 1 });
    setAdding(false);
  }

  function moveKid(
    i: number,
    from: { col: number; index: number },
    to: { col: number; index: number }
  ) {
    const kids = kidsOf(blocks[i]).map((c) => [...c]);
    while (kids.length <= Math.max(from.col, to.col)) kids.push([]);
    const [k] = kids[from.col].splice(from.index, 1);
    if (!k) return;
    kids[to.col].splice(to.index, 0, k);
    setKids(i, kids);
    setInside({ block: i, col: to.col, index: to.index });
  }

  function removeKid(i: number, col: number, index: number) {
    const kids = kidsOf(blocks[i]).map((c) => [...c]);
    kids[col].splice(index, 1);
    setKids(i, kids);
    setInside(null);
  }

  function setKidField(name: string, value: string) {
    if (!inside) return;
    const kids = kidsOf(blocks[inside.block]).map((c) => [...c]);
    const key = device && PER_DEVICE.includes(name) ? `${name}_${device}` : name;
    kids[inside.col][inside.index] = { ...kids[inside.col][inside.index], [key]: value };
    setKids(inside.block, kids);
  }

  function set(i: number, name: string, value: string) {
    const key = fieldName(name);
    const next = blocks.map((b, n) => (n === i ? { ...b, [key]: value } : b));
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
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

  // What the panel is editing: a block, or a child inside a container.
  const parent = picked != null ? blocks[picked] : null;
  const kid =
    inside && parent && isContainer(parent.type)
      ? kidsOf(parent)[inside.col]?.[inside.index] ?? null
      : null;
  const current = kid ?? parent;
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
        <div className="pb-devices" role="group" aria-label="Screen">
          {DEVICES.map(([id, label]) => (
            <button
              type="button"
              key={id || "desktop"}
              className={device === id ? "on" : ""}
              onClick={() => setDevice(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={undo}
            disabled={!past.length}
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={redo}
            disabled={!future.length}
            title="Redo"
          >
            Redo
          </button>
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
        <div
          className="pb-canvas"
          style={
            device
              ? {
                  width: DEVICES.find(([id]) => id === device)?.[2],
                  maxWidth: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }
              : undefined
          }
        >
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
                  onClick={(e) => {
                    setPicked(i);
                    if (!isContainer(b.type)) setInside(null);
                    // The part under the pointer, if it has a name.
                    const el = (e.target as HTMLElement).closest("[data-el]");
                    const name = el?.getAttribute("data-el") ?? "";
                    setElement(name);
                    if (name) setTab("element");
                  }}
                  draggable
                  onDragStart={(e) => {
                    // The drag begins on the block, so the card has to be
                    // found by where the pointer is, not by the target.
                    const under = document.elementFromPoint(e.clientX, e.clientY);
                    const card = (under as HTMLElement)?.closest?.("[data-row]");
                    const name = card?.getAttribute("data-row");
                    if (name) {
                      setRow({ block: i, name });
                      e.stopPropagation();
                      return;
                    }
                    setDragging(i);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(i);
                    // Show which card the drop will land on.
                    const under = document.elementFromPoint(e.clientX, e.clientY);
                    const card = (under as HTMLElement)?.closest?.("[data-row]");
                    e.currentTarget
                      .querySelectorAll("[data-row].dropping")
                      .forEach((n) => n.classList.remove("dropping"));
                    if (row && card) card.classList.add("dropping");
                  }}
                  onDragLeave={() => setOver((o) => (o === i ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();

                    // Dropped on a card: reorder the list.
                    const under = document.elementFromPoint(e.clientX, e.clientY);
                    const onto = (under as HTMLElement)?.closest?.("[data-row]");
                    const name = onto?.getAttribute("data-row");
                    if (row && row.block === i && name && name !== row.name) {
                      const names = [
                        ...(e.currentTarget.querySelectorAll("[data-row]") as NodeListOf<HTMLElement>),
                      ].map((n) => n.getAttribute("data-row") as string);
                      const from = names.indexOf(row.name);
                      const to = names.indexOf(name);
                      names.splice(to, 0, ...names.splice(from, 1));
                      setRaw(i, "order", names.join(","));
                      setRow(null);
                      setDragging(null);
                      setOver(null);
                      return;
                    }

                    if (dragging != null) move(dragging, i);
                    setRow(null);
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
                  <div className="pb-render pb-pick">
                    {isContainer(b.type) ? (
                      <Container
                        block={b}
                        data={data}
                        chosen={inside?.block === i ? inside : null}
                        onPick={(col, index) => {
                          setPicked(i);
                          setInside({ block: i, col, index });
                          setTab("content");
                        }}
                        onDragKid={(col, index) => setDragKid({ block: i, col, index })}
                        onDropKid={(col, index) => {
                          if (dragKid && dragKid.block === i)
                            moveKid(i, { col: dragKid.col, index: dragKid.index }, { col, index });
                          setDragKid(null);
                        }}
                        onAdd={(col) => {
                          setPicked(i);
                          setAddingTo({ block: i, col });
                          setAdding(true);
                        }}
                      />
                    ) : (
                      <Blocks blocks={[b]} data={data} />
                    )}
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
                <h3 style={{ fontSize: 14 }}>{showing === "patterns" ? "Add a section" : "Add a block"}</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAdding(false);
                    setAddingTo(null);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="pb-tabs" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className={showing === "patterns" ? "on" : ""}
                  onClick={() => setShowing("patterns")}
                >
                  Ready made
                </button>
                <button
                  type="button"
                  className={showing === "blocks" ? "on" : ""}
                  onClick={() => setShowing("blocks")}
                >
                  One block
                </button>
              </div>

              {showing === "patterns" ? (
                <div className="pb-palette">
                  {PATTERN_GROUPS.map((g) => (
                    <div key={g}>
                      <p className="pb-group">{g}</p>
                      {PATTERNS.filter((p) => p.group === g).map((p) => (
                        <button
                          type="button"
                          key={p.name}
                          onClick={() => addPattern(p)}
                        >
                          <b>{p.name}</b>
                          <span>{p.about}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
              <div className="pb-palette">
                {BLOCKS.map((s) => (
                  <button
                    type="button"
                    key={s.type}
                    onClick={() =>
                      addingTo
                        ? addKid(addingTo.block, addingTo.col, s.type)
                        : add(s.type, picked == null ? undefined : picked + 1)
                    }
                  >
                    <b>{s.label}</b>
                    <span>{s.about}</span>
                  </button>
                ))}
              </div>
              )}
            </div>
          ) : current && spec ? (
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: 14 }}>
                    {kid ? `${spec.label}, inside the columns` : spec.label}
                  </h3>
                  <p className="muted small" style={{ marginTop: 2 }}>
                    {spec.about}
                  </p>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {kid ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        removeKid(picked as number, inside!.col, inside!.index)
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setAddingTo(null);
                      setAdding(true);
                    }}
                  >
                    Add a block
                  </button>
                </div>
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
                  Block
                </button>
                <button
                  type="button"
                  className={tab === "element" ? "on" : ""}
                  onClick={() => setTab("element")}
                >
                  Element
                </button>
              </div>

              {tab === "element" ? (
                <div className="pb-fields">
                  <label className="field">
                    <span>Which part</span>
                    <select value={element} onChange={(e) => setElement(e.target.value)}>
                      <option value="">Choose a part, or click one on the left</option>
                      {(ELEMENTS[current.type] ?? []).map((el) => (
                        <option key={el.name} value={el.name}>
                          {el.label}
                          {touchedElements(current).includes(el.name) ? " (changed)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {element ? (
                    <div className="stack" style={{ marginTop: 12 }}>
                      {ELEMENT_FIELDS.map((f) => (
                        <Field
                          key={f.name}
                          field={f}
                          device={device}
                          value={current[elKey(element, f.name, device)] ?? ""}
                          custom={current[elKey(element, `${f.name}_custom`)] ?? ""}
                          onChange={(v) =>
                            setRaw(picked as number, elKey(element, f.name, device), v)
                          }
                          onCustom={(v) =>
                            setRaw(picked as number, elKey(element, `${f.name}_custom`), v)
                          }
                        />
                      ))}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => clearElement(picked as number, element)}
                      >
                        Put this part back as designed
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="stack pb-fields" hidden={tab === "element"}>
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
                      value={
                        (device && PER_DEVICE.includes(f.name)
                          ? current[`${f.name}_${device}`]
                          : current[f.name]) ?? ""
                      }
                      custom={current[`${f.name}_custom`] ?? ""}
                      device={PER_DEVICE.includes(f.name) ? device : ""}
                      onChange={(v) =>
                        kid ? setKidField(f.name, v) : set(picked as number, f.name, v)
                      }
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

// A container on the canvas: its columns, its children, and the places
// a child can be dropped.
function Container({
  block,
  data,
  chosen,
  onPick,
  onDragKid,
  onDropKid,
  onAdd,
}: {
  block: Block;
  data: BlockData;
  chosen: { col: number; index: number } | null;
  onPick: (col: number, index: number) => void;
  onDragKid: (col: number, index: number) => void;
  onDropKid: (col: number, index: number) => void;
  onAdd: (col: number) => void;
}) {
  const count = Number(block.count) || 2;
  const kids = kidsOf(block);
  const gap = block.gap === "tight" ? 10 : block.gap === "roomy" ? 34 : 20;

  return (
    <section className="sec">
      <div
        className={`cols ${block.stack === "keep" ? "cols-keep" : ""}`}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`, gap }}
      >
        {Array.from({ length: count }).map((_, col) => (
          <div
            className="col"
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropKid(col, (kids[col] ?? []).length);
            }}
          >
            {(kids[col] ?? []).map((k, index) => (
              <div
                key={index}
                className={`pb-kid ${
                  chosen && chosen.col === col && chosen.index === index ? "on" : ""
                }`}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragKid(col, index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDropKid(col, index);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(col, index);
                }}
              >
                <Blocks blocks={[k]} data={data} />
              </div>
            ))}

            <button
              type="button"
              className="pb-addcol"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(col);
              }}
            >
              Add a block here
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  field,
  value,
  custom = "",
  device = "",
  onChange,
  onCustom,
}: {
  field: BlockField;
  value: string;
  custom?: string;
  device?: string;
  onChange: (v: string) => void;
  onCustom?: (v: string) => void;
}) {
  // A setting being written for one screen says so.
  const label = device
    ? `${field.label} (${device === "sm" ? "phone" : "tablet"})`
    : field.label;
  if (field.kind === "image")
    return (
      <div className="field">
        <Uploader
          name={`x_${field.name}`}
          label={label}
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
        <span>{label}</span>
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
        <span>{label}</span>
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
        <span>{label}</span>
        <RichText name={`x_${field.name}`} defaultValue={value} rows={4} onChange={onChange} />
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );

  if (field.kind === "select")
    return (
      <label className="field">
        <span>{label}</span>
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
      <span>{label}</span>
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
Write-File "components\page-builder.tsx" $f4

$f5 = @'
import Link from "next/link";
import { currentMember } from "@/lib/member";
import { Ic } from "@/components/icon";
import { Logo } from "@/components/brand";
import { Av } from "@/components/bits";
import { menu, forWho } from "@/lib/menus";

const PUBNAV: [string, string][] = [
  ["/discover", "Discover"],
  ["/how-it-works", "How it works"],
  ["/membership", "Membership"],
  ["/events", "Events"],
  ["/watch", "Watch & Listen"],
];

// The header, on every page of the site. Signed out it offers the way
// in; signed in it offers the way to your own pages. The links across
// the middle never change, so the site is always navigable from the top.
export async function SiteHeader() {
  const member = await currentMember();

  // The menu the Global team keeps, or the one written below if they
  // have not made one.
  const saved = await menu("header");
  const links: [string, string][] = forWho(saved, Boolean(member)).length
    ? forWho(saved, Boolean(member)).map((i) => [i.href, i.label] as [string, string])
    : PUBNAV;
  const user = member;
  const name = member?.full_name ?? null;

  return (
    <header className="pubhead">
      <div className="in">
        {/* The wordmark is the site, so it always goes to the front door.
            Getting into the member area is a deliberate move, which is
            what Your home beside it is for. */}
        <Logo href="/" />

        <nav className="pubnav">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        {user ? (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/search">
              <Ic name="search" />
            </Link>
            <Link className="loginlink hide-m" href="/home" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Your home
            </Link>
            <Link className="btn btn-ghost btn-sm hide-m" href="/my-village">
              Your Village
            </Link>
            <Link href="/me" aria-label={name ?? "You"}>
              <Av name={name ?? "You"} className="av-sm" />
            </Link>
          </>
        ) : (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/discover">
              <Ic name="search" />
            </Link>
            <Link className="loginlink" href="/login" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Log in
            </Link>
            <Link className="btn btn-primary btn-sm hide-m" href="/apply">
              Request your invitation
            </Link>
          </>
        )}

        <Link className="iconbtn menubtn" aria-label="Menu" href={user ? "/more" : "/menu"}>
          <Ic name="menu" />
        </Link>
      </div>
    </header>
  );
}
'@
Write-File "components\site-header.tsx" $f5

$f6 = @'
// The rail of spaces and the sidebar inside each one, as the prototype
// arranges them. Each entry is [href, icon, label, count?].
export type NavItem = [string, string, string, number?];
export type Space = { id: string; label: string; icon: string; items: NavItem[] };

export const MEMBER_SPACES: Space[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    items: [
      ["/home", "home", "Feed"],
      ["/for-you", "sparkle", "For you"],
      ["/messages", "chat", "Messages"],
      ["/notifications", "bell", "Notifications"],
      ["/directory", "users", "Directory"],
      ["/search", "search", "Search"],
    ],
  },
  {
    id: "village",
    label: "Your Village",
    icon: "pin",
    items: [
      ["/my-village", "hand", "Ask & Offer"],
      ["/my-village/members", "users", "Members"],
      ["/my-village/circles", "rings", "Circles"],
      ["/my-village/announcements", "bell", "Announcements"],
      ["/events", "cal", "Events"],
      ["/library", "book", "Resources"],
    ],
  },
  {
    id: "circle",
    label: "Your groups",
    icon: "rings",
    items: [
      ["/groups", "users", "Industry Groups"],
      ["/pods", "check", "Pods"],
      ["/network", "globe", "The network"],
    ],
  },
  {
    id: "work",
    label: "Work",
    icon: "briefcase",
    items: [
      ["/businesses", "briefcase", "Businesses"],
      ["/jobs", "tag", "Jobs and freelance"],
      ["/learning", "book", "Learning"],
      ["/markets", "globe", "Explore markets"],
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: "video",
    items: [
      ["/media", "book", "Stories"],
      ["/watch", "video", "Watch and Listen"],
    ],
  },
  {
    id: "you",
    label: "You",
    icon: "user",
    items: [
      ["/me", "user", "My profile"],
      ["/me/edit", "edit", "Edit profile"],
      ["/settings", "gear", "Settings"],
      ["/membership", "star", "Membership"],
    ],
  },
];

export const ADMIN_SPACES: Space[] = [
  {
    id: "people",
    label: "People",
    icon: "users",
    items: [
      ["/admin", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/admin/members", "users", "Members"],
      ["/admin/circles", "rings", "Circles"],
      ["/admin/care", "heart", "Member care"],
      ["/admin/re-enrolment", "star", "Re-enrolment"],
      ["/admin/whatsapp", "chat", "WhatsApp sync"],
      ["/admin/transfers", "move", "Moves"],
      ["/admin/mix", "globe", "Village mix"],
      ["/admin/leadership", "star", "Leadership"],
    ],
  },
  {
    id: "whatson",
    label: "What is on",
    icon: "cal",
    items: [
      ["/admin/events", "cal", "Events"],
      ["/admin/live", "video", "Live rooms"],
      ["/admin/announcements", "bell", "Announcements"],
      ["/admin/partners", "star", "Partnered events"],
    ],
  },
  {
    id: "read",
    label: "What there is to read",
    icon: "book",
    items: [
      ["/admin/resources", "book", "Resources"],
      ["/admin/media", "video", "Watch and Listen"],
    ],
  },
  {
    id: "listening",
    label: "Listening",
    icon: "heart",
    items: [
      ["/admin/reports", "flag", "Reports"],
      ["/admin/suggestions", "inbox", "Suggestion box"],
      ["/admin/insight", "sliders", "Insight"],
      ["/admin/settings", "gear", "Village settings"],
    ],
  },
];

export const GLOBAL_SPACES: Space[] = [
  {
    id: "net",
    label: "Network",
    icon: "globe",
    items: [
      ["/global", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/global/villages", "pin", "Villages"],
      ["/global/events", "cal", "Events"],
      ["/global/cities", "plus", "City suggestions"],
      ["/admin/members", "users", "Members and roles"],
      ["/global/roles", "shield", "Permissions"],
      ["/global/plans", "card", "Plans and benefits"],
      ["/global/mix", "globe", "Nationality limits"],
      ["/global/groups", "rings", "Groups and Pods"],
      ["/global/requests", "inbox", "Requests"],
      ["/global/moderation", "flag", "Moderation"],
      ["/global/suggestions", "sparkle", "Suggestions"],
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "edit",
    items: [
      ["/global/content", "edit", "Pages"],
      ["/global/wording", "edit", "Wording"],
      ["/global/menus", "list", "Menus"],
      ["/global/media", "book", "Articles"],
      ["/global/photos", "image", "Photos and consent"],
      ["/global/library", "list", "Resources library"],
      ["/admin/media", "video", "Watch and Listen"],
      ["/global/emails", "mail", "Emails"],
    ],
  },
  {
    id: "money",
    label: "Money and marketplaces",
    icon: "card",
    items: [
      ["/global/money", "card", "Payments and tickets"],
      ["/global/recognition", "heart", "Team recognition"],
      ["/global/learning", "star", "Educators and courses"],
      ["/global/businesses", "briefcase", "Business listings"],
      ["/global/partners", "star", "Partnered events"],
      ["/global/markets", "globe", "Market pathways"],
    ],
  },
  {
    id: "insight",
    label: "Insight",
    icon: "sliders",
    items: [
      ["/global/reporting", "sliders", "Analytics"],
      ["/global/network", "sparkle", "Network intelligence"],
      ["/global/audit", "list", "Audit log"],
      ["/global/settings", "gear", "System settings"],
    ],
  },
];

export const LEAD_SPACES: Space[] = [
  {
    id: "lead",
    label: "Leader tools",
    icon: "rings",
    items: [
      ["/lead", "rings", "Your Circle"],
                ],
  },
];

export const EDU_SPACES: Space[] = [
  {
    id: "teach",
    label: "Educator",
    icon: "star",
    items: [
      ["/educator", "grid", "Overview"],
            ["/educator/learners", "users", "Learners"],
      ["/educator/sales", "card", "Sales"],
      ["/educator/payouts", "download", "Payouts"],
      ["/educator/profile", "user", "Educator profile"],
    ],
  },
];

export const SPACES: Record<string, Space[]> = {
  member: MEMBER_SPACES,
  admin: ADMIN_SPACES,
  global: GLOBAL_SPACES,
  lead: LEAD_SPACES,
  edu: EDU_SPACES,
};

// The bottom tabs on a phone.
export const TABS: Record<string, NavItem[]> = {
  member: [
    ["/home", "home", "Home"],
    ["/my-village", "pin", "Village"],
    ["/events", "cal", "Events"],
    ["/messages", "chat", "Messages"],
    ["/more", "menu", "More"],
  ],
  admin: [
    ["/admin", "grid", "Overview"],
    ["/admin/applications", "inbox", "Review"],
    ["/admin/members", "users", "Members"],
    ["/admin/circles", "rings", "Circles"],
    ["/admin/more", "menu", "More"],
  ],
  global: [
    ["/global", "grid", "Overview"],
    ["/admin/applications", "inbox", "Decisions"],
    ["/global/villages", "pin", "Villages"],
    ["/admin/members", "users", "Members"],
    ["/global/more", "menu", "More"],
  ],
  lead: [
    ["/lead", "rings", "What you run"],
    ["/home", "home", "Member view"],
    ["/lead/more", "menu", "More"],
  ],
  edu: [
    ["/educator", "grid", "Overview"],
    ["/educator/learners", "users", "Learners"],
    ["/educator/sales", "card", "Sales"],
    ["/educator/more", "menu", "More"],
  ],
};

// The other workspaces, for the foot of the sidebar.
export const OTHER_WORKSPACES: [string, string, string][] = [
  ["member", "home", "Member space"],
  ["lead", "rings", "Leader tools"],
  ["edu", "star", "Educator"],
  ["admin", "pin", "Local Admin"],
  ["global", "globe", "Global team"],
];

export const WORKSPACE_START: Record<string, string> = {
  member: "/home",
  lead: "/lead",
  edu: "/educator",
  admin: "/admin",
  global: "/global",
};
'@
Write-File "components\spaces.ts" $f6

$f7 = @'
import { PageHead } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { MenuEditor } from "./forms";

export const metadata = { title: "Menus, ExpatPreneurs Global" };

const MENUS: [string, string][] = [
  ["header", "The header, across the top of every page"],
  ["footer_explore", "Footer, Explore"],
  ["footer_villages", "Footer, Villages"],
  ["footer_marketplace", "Footer, Marketplace"],
  ["footer_stories", "Footer, Stories"],
  ["footer_company", "Footer, Company"],
  ["legal", "Footer, the small print"],
];

// Where a new page gets put so people can find it.
export default async function MenusPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: items }, { data: pages }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, menu, label, href, position, new_tab, signed_in")
      .order("position"),
    supabase.from("pages").select("title, path, status").order("title"),
  ]);

  return (
    <>
      <PageHead
        title="Menus"
        sub="What appears in the header and the footer. A page nobody links to is a page nobody finds."
      />

      <MenuEditor
        menus={MENUS}
        items={items ?? []}
        pages={(pages ?? []).map((p) => ({
          label: p.title,
          href: p.path,
          live: p.status === "live",
        }))}
      />
    </>
  );
}
'@
Write-File "app\global\menus\page.tsx" $f7

$f8 = @'
"use client";

import { useState } from "react";
import { saveMenu, type MenuRow, type MenuState } from "./actions";
import { SITE_LINKS } from "@/lib/blocks";
import { Ic } from "@/components/icon";

export function MenuEditor({
  menus,
  items,
  pages,
}: {
  menus: [string, string][];
  items: MenuRow[];
  pages: { label: string; href: string; live: boolean }[];
}) {
  const [which, setWhich] = useState(menus[0][0]);
  const [rows, setRows] = useState<MenuRow[]>(items);
  const [state, setState] = useState<MenuState>({});
  const [saving, setSaving] = useState(false);

  const mine = rows
    .filter((r) => r.menu === which)
    .sort((a, b) => a.position - b.position);

  // Where a link can point: the pages that exist, then the rest of the
  // site, then anything typed by hand.
  const choices: [string, string][] = [
    ...pages.map((p) => [p.href, `${p.label}${p.live ? "" : " (draft)"}`] as [string, string]),
    ...SITE_LINKS.filter(([v]) => v && v !== "custom" && !pages.some((p) => p.href === v)),
  ];

  function change(i: number, patch: Partial<MenuRow>) {
    const all = [...rows];
    const index = rows.indexOf(mine[i]);
    all[index] = { ...all[index], ...patch };
    setRows(all);
    setState({});
  }

  function add() {
    setRows([
      ...rows,
      { menu: which, label: "", href: "", position: mine.length + 1, signed_in: "anyone" },
    ]);
  }

  function remove(i: number) {
    setRows(rows.filter((r) => r !== mine[i]));
  }

  function move(i: number, by: number) {
    const to = i + by;
    if (to < 0 || to >= mine.length) return;
    const order = [...mine];
    const [row] = order.splice(i, 1);
    order.splice(to, 0, row);
    const renumbered = order.map((r, n) => ({ ...r, position: n + 1 }));
    setRows([...rows.filter((r) => r.menu !== which), ...renumbered]);
  }

  async function save() {
    setSaving(true);
    setState(await saveMenu(which, mine));
    setSaving(false);
  }

  return (
    <div className="gside">
      <div>
        <div className="tabs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          {menus.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className="tabbtn"
              aria-current={which === id ? "page" : undefined}
              onClick={() => setWhich(id)}
            >
              {label.startsWith("Footer") ? label.replace("Footer, ", "") : "Header"}
            </button>
          ))}
        </div>

        <div className="stack">
          {mine.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted small" style={{ margin: 0 }}>
                Nothing in this menu yet. The site shows whatever the code
                has until you add something here.
              </p>
            </div>
          ) : null}

          {mine.map((row, i) => (
            <div className="panel" key={i}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <b>{row.label || "Untitled"}</b>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)}>
                    Up
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)}>
                    Down
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i)}>
                    Remove
                  </button>
                </div>
              </div>

              <div className="formgrid" style={{ marginTop: 12 }}>
                <label className="field">
                  <span>What it says</span>
                  <input
                    value={row.label}
                    onChange={(e) => change(i, { label: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Where it goes</span>
                  <select
                    value={choices.some(([v]) => v === row.href) ? row.href : "custom"}
                    onChange={(e) =>
                      change(i, { href: e.target.value === "custom" ? "" : e.target.value })
                    }
                  >
                    <option value="">Choose a page</option>
                    {choices.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                    <option value="custom">Somewhere else</option>
                  </select>
                </label>

                {!choices.some(([v]) => v === row.href) ? (
                  <label className="field full">
                    <span>The address</span>
                    <input
                      value={row.href}
                      placeholder="/somewhere or https://"
                      onChange={(e) => change(i, { href: e.target.value })}
                    />
                  </label>
                ) : null}

                <label className="field">
                  <span>Who sees it</span>
                  <select
                    value={row.signed_in ?? "anyone"}
                    onChange={(e) => change(i, { signed_in: e.target.value })}
                  >
                    <option value="anyone">Everybody</option>
                    <option value="visitors">Only people who are signed out</option>
                    <option value="members">Only members</option>
                  </select>
                </label>
              </div>
            </div>
          ))}

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={add}>
              <Ic name="plus" />
              Add a link
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving" : "Save this menu"}
            </button>
            {state.done ? <span className="chip chip-mint">Saved</span> : null}
            {state.error ? <span className="chip chip-sun">{state.error}</span> : null}
          </div>
        </div>
      </div>

      <aside className="panel panel-wash">
        <h3 style={{ fontSize: 14 }}>Making a new page findable</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Make the page under Pages, publish it, then add a link here
          pointing at it. A page that is still a draft appears in the list
          marked as one, so you can set the link up before it goes live.
        </p>
      </aside>
    </div>
  );
}
'@
Write-File "app\global\menus\forms.tsx" $f8

$f9 = @'
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";

export type MenuState = { error?: string; done?: boolean };

export type MenuRow = {
  id?: string;
  menu: string;
  label: string;
  href: string;
  position: number;
  new_tab?: boolean;
  signed_in?: string;
};

// The whole menu arrives at once, so removing an item is simply not
// sending it.
export async function saveMenu(menu: string, rows: MenuRow[]): Promise<MenuState> {
  await requireGlobal();
  const supabase = await createClient();

  const clean = rows
    .filter((r) => r.label.trim() && r.href.trim())
    .map((r, i) => ({
      id: r.id,
      menu,
      label: r.label.trim(),
      href: r.href.trim(),
      position: i + 1,
      new_tab: Boolean(r.new_tab),
      signed_in: r.signed_in ?? "anyone",
      updated_at: new Date().toISOString(),
    }));

  const keep = clean.map((r) => r.id).filter(Boolean) as string[];

  // Anything that was in this menu and is not in what arrived has gone.
  let gone = supabase.from("menu_items").delete().eq("menu", menu);
  if (keep.length) gone = gone.not("id", "in", `(${keep.join(",")})`);
  const { error: removed } = await gone;
  if (removed) return { error: removed.message };

  if (clean.length) {
    const { error } = await supabase
      .from("menu_items")
      .upsert(clean.map((r) => (r.id ? r : { ...r, id: undefined })));
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/global/menus");
  return { done: true };
}
'@
Write-File "app\global\menus\actions.ts" $f9

$f10 = @'
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

/* The workspace menu folds away */
.sidefold{width:34px;height:34px;border-radius:10px;border:1px solid #C7CDD4;background:var(--wash);
  color:var(--ink);display:grid;place-items:center;cursor:pointer;flex:none;
  box-shadow:0 1px 3px rgba(15,20,25,.1)}
.sidefold:hover{background:#fff;border-color:var(--blue);color:var(--blue)}
.sidefold .ic{width:16px;height:16px;transform:rotate(180deg)}
.mapp.side-shut .sidefold .ic{transform:none}
.mapp.side-shut > .mside{display:none}
.mapp.side-shut.v2{grid-template-columns:72px minmax(0,1fr)}
.mapp.side-shut.v2.no-rail{grid-template-columns:minmax(0,1fr)}
.admin .sidefold,.shell-global .sidefold{background:var(--wash);border-color:#C7CDD4;color:var(--ink)}

/* The screens in the builder */
.pb-devices{display:inline-flex;gap:3px;padding:3px;border-radius:999px;background:rgba(15,20,25,.05)}
.pb-devices button{border:0;background:transparent;border-radius:999px;padding:6px 14px;
  font:600 12.5px var(--body);color:var(--muted);cursor:pointer}
.pb-devices button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(15,20,25,.14)}
.pb-canvas{transition:width .18s ease}

/* Parts of a block can be clicked in the canvas */
.pb-pick{pointer-events:auto}
.pb-pick a,.pb-pick button,.pb-pick input,.pb-pick select,.pb-pick textarea,.pb-pick summary{pointer-events:none}
.pb-pick [data-el]{outline-offset:2px}
.pb-pick [data-el]:hover{outline:1px dashed var(--blue)}
.pb-tabs button{padding:7px 10px}

/* Columns, and what a column looks like while it is empty */
.cols{display:grid;align-items:start}
.col{min-width:0;display:grid;gap:14px;align-content:start}
@media (max-width:760px){.cols:not(.cols-keep){grid-template-columns:1fr!important}}
.pb-pick .col:empty,.pb-pick .col.drop{min-height:90px;border:1px dashed #C7CDD4;border-radius:12px}
.pb-pick .col.drop{border-color:var(--blue);background:rgba(64,116,174,.06)}
.pb-kid{position:relative;border:2px solid transparent;border-radius:10px}
.pb-kid.on{border-color:var(--blue)}
.pb-kid:hover{border-color:#DCE3EA}
.pb-addcol{width:100%;border:1px dashed #C7CDD4;background:transparent;border-radius:10px;padding:8px;
  font:600 12px var(--body);color:var(--muted);cursor:pointer}
.pb-addcol:hover{border-color:var(--blue);color:var(--blue);background:rgba(64,116,174,.05)}

/* A card being dragged over */
.pb-pick [data-row]{cursor:grab}
.pb-pick [data-row].dropping{outline:2px solid var(--mint);outline-offset:3px;border-radius:12px}

/* A video from elsewhere */
.embed{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#0F1720}
.embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.pb-group{font:700 11px var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);
  margin:12px 0 6px}
.tabs .tabbtn{border:0;background:transparent;padding:11px 14px;font:500 13px var(--body);
  color:var(--muted);border-bottom:2px solid transparent;cursor:pointer}
.tabs .tabbtn[aria-current]{color:var(--ink);border-bottom-color:var(--ink);font-weight:600}
'@
Write-File "app\forms.css" $f10

$f11 = @'
-- The menus, so a new page can be put where people will find it.
--
-- Until now the header and the footer were written into the code, so
-- creating a page left it unreachable unless a developer linked to it.
-- These rows are the menus. An empty table changes nothing: the header
-- and footer fall back to what the code has always shown.

create table if not exists menu_items (
  id         uuid primary key default gen_random_uuid(),
  menu       text not null,
  label      text not null,
  href       text not null,
  position   int not null default 0,
  new_tab    boolean not null default false,
  signed_in  text not null default 'anyone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column menu_items.menu is
  'header, footer_explore, footer_villages, footer_marketplace, footer_stories, footer_company, legal';
comment on column menu_items.signed_in is
  'anyone, visitors, members';

create index if not exists menu_items_menu_idx on menu_items(menu, position);

alter table menu_items enable row level security;

drop policy if exists menu_items_read on menu_items;
create policy menu_items_read on menu_items for select using (true);

drop policy if exists menu_items_write on menu_items;
create policy menu_items_write on menu_items
  for all using (is_global_admin()) with check (is_global_admin());

-- The header as it stands today, so the screen opens with something
-- real rather than empty.
insert into menu_items (menu, label, href, position)
select * from (values
  ('header', 'Discover', '/discover', 1),
  ('header', 'How it works', '/how-it-works', 2),
  ('header', 'Membership', '/membership', 3),
  ('header', 'Events', '/events', 4),
  ('header', 'Watch & Listen', '/watch', 5)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'header');
'@
Write-File "supabase\migrations\0052_menus.sql" $f11

git add app components lib supabase
git commit -m "Ready made sections, four more blocks, menus, and a drag that works"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0052_menus.sql"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
