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
      // A bot check that cannot even load its own script must not take
      // the page with it.
      script.onerror = () => {};
      document.head.appendChild(script);
    } else {
      render();
    }

    function render() {
      const api = (window as unknown as {
        turnstile?: {
          render: (el: Element, o: Record<string, unknown>) => string | undefined;
          remove?: (id: string) => void;
        };
      }).turnstile;
      if (!api || !box.current || box.current.hasChildNodes()) return;

      // Everything below is wrapped, and every error Turnstile can report
      // is handed back to us rather than thrown.
      //
      // Without this the whole page went blank. A site key that is not
      // valid for the domain it is served on makes Turnstile throw
      // TurnstileError 600010, uncaught, from inside this effect, which
      // React treats as a render failure and answers by unmounting the
      // tree. The server returned the full page, 200 and forty kilobytes
      // of it, and the browser threw it away: /events, /media and
      // /members showed a bare header and nothing else. It is doing that
      // on the live site now.
      //
      // The check itself is not weakened by this. captchaPassed on the
      // server decides whether a form is accepted, and with no token it
      // refuses, so a broken widget closes the forms rather than opening
      // them. It just no longer closes the pages as well.
      // Declared before the call, not by it. The error callback is handed
      // to render and Turnstile can fire it synchronously from inside
      // that same call, so a const assigned by the call itself would
      // still be in its dead zone and reading it would throw a second
      // error out of the handler meant to contain the first.
      let widget: string | undefined;

      try {
        widget = api.render(box.current, {
          sitekey: SITE_KEY,
          theme: "light",
          appearance: "interaction-only",
          execution: "render",
          "refresh-expired": "auto",
          "response-field-name": "cf-turnstile-response",
          "error-callback": () => {
            // Take the widget down rather than letting it retry in a
            // loop, which is what filled the console with the same error
            // seven times over.
            try {
              if (widget && api.remove) api.remove(widget);
            } catch {
              // Nothing left to do about it.
            }
            return true;
          },
        });
      } catch {
        // Already handled: the form still submits and the server still
        // decides.
      }
    }
  }, []);

  if (!SITE_KEY) return null;
  // No margin and no height of its own, so the form looks the same with
  // the check as without it. If Cloudflare does need a click, the box
  // grows to fit.
  return <div ref={box} style={{ minHeight: 0 }} />;
}
