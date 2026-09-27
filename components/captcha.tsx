"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The captcha, if there is one. With no site key this renders nothing at
// all, so the forms work exactly as they do today until Cloudflare is
// set up.
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
        api.render(box.current, { sitekey: SITE_KEY, theme: "light" });
      }
    }
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={box} style={{ marginTop: 14 }} />;
}