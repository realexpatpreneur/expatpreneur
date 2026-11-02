"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The bot check, kept invisible. Turnstile runs in the background when
// the form appears and puts its answer in a hidden field called
// cf-turnstile-response, which the server action checks. Nobody sees a
// box or ticks anything.
//
// With a site key created in "Invisible" mode nothing is ever shown.
// With a "Managed" key, interaction-only keeps it hidden too, and a
// challenge appears only for the rare visitor Cloudflare is unsure of.
// With no site key at all this renders nothing, and the server lets the
// form through, so the forms work exactly as before until the keys exist.
export function Captcha() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;

    const id = "cf-turnstile";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.id = id;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }

    function render() {
      const api = (window as unknown as {
        turnstile?: { render: (el: Element, o: Record<string, unknown>) => void };
      }).turnstile;
      if (api && box.current && !box.current.hasChildNodes()) {
        api.render(box.current, {
          sitekey: SITE_KEY,
          theme: "light",
          appearance: "interaction-only",
          execution: "render",
          "refresh-expired": "auto",
          "response-field-name": "cf-turnstile-response",
        });
      }
    }
  }, []);

  if (!SITE_KEY) return null;
  // No margin and no height of its own, so the form looks the same with
  // the check as without it. If Cloudflare does need a click, the box
  // grows to fit.
  return <div ref={box} style={{ minHeight: 0 }} />;
}
