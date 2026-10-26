"use client";

import { useState } from "react";

// The invitation address exists to be pasted into WhatsApp, so the useful
// thing is taking a copy of it, not reading seventy characters of token.
// The address is still shown, cut off where it stops mattering, and the
// whole of it is what gets copied.
export function CopyLink({ href }: { href: string }) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setDone(true);
      setFailed(false);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // Older browsers, and any page not served over https, refuse the
      // clipboard. Selecting the address by hand still works, so say so
      // rather than failing silently.
      setFailed(true);
    }
  }

  // Everybody's address starts with the same site, so showing that part
  // fills the space with the one thing that tells you nothing. What is
  // worth seeing is the end, which is theirs.
  const shown = href.replace(/^https?:\/\/[^/]+/, "");

  return (
    <div className="relink">
      <span className="relink-url" title={href}>
        {shown}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
        {done ? "Copied" : failed ? "Select it" : "Copy link"}
      </button>
    </div>
  );
}
