"use client";

import { useState } from "react";

// The tabs across a profile. The panes are rendered on the server and
// handed in; this only decides which one is showing.
export function ProfileTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(tabs[0]?.id);
  return (
    <>
      <div className="sp-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={open === t.id}
            onClick={() => setOpen(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div className="sp-pane" key={t.id} hidden={open !== t.id}>
          {t.content}
        </div>
      ))}
    </>
  );
}