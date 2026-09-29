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