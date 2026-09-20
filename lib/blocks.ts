// The shape of a page block, kept apart from anything that talks to the
// database so the editor can import it in the browser.
export type Block =
  | {
      type: "hero";
      heading?: string;
      text?: string;
      button_label?: string;
      button_href?: string;
      second_label?: string;
      second_href?: string;
      image_url?: string;
    }
  | { type: "heading"; heading?: string }
  | { type: "text"; body?: string }
  | { type: "villages"; show?: string }
  | { type: "story"; heading?: string; body?: string };

export const blockLabel: Record<string, string> = {
  hero: "Hero",
  heading: "Heading",
  text: "Text",
  villages: "Villages",
  story: "Founder story",
};