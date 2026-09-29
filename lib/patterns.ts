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