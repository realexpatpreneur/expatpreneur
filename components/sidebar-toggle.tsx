"use client";

import { useEffect, useState } from "react";
import { Ic } from "@/components/icon";

// Folds the workspace sidebar away, for when the page needs the room.
// The choice is remembered, so it stays folded between pages.
export function SidebarToggle() {
  const [shut, setShut] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ep-side") === "shut";
    setShut(saved);
  }, []);

  useEffect(() => {
    const app = document.querySelector(".mapp");
    if (!app) return;
    app.classList.toggle("side-shut", shut);
    try {
      window.localStorage.setItem("ep-side", shut ? "shut" : "open");
    } catch {
      // A browser that refuses storage still gets the toggle.
    }
  }, [shut]);

  return (
    <button
      type="button"
      className="sidefold"
      onClick={() => setShut(!shut)}
      title={shut ? "Show the menu" : "Hide the menu"}
      aria-label={shut ? "Show the menu" : "Hide the menu"}
    >
      <Ic name="chev" />
    </button>
  );
}