"use client";

type Row = { email: string; source: string | null; created_at: string };

// A copy of the list, for the day it has to go somewhere else. Built in
// the browser from what is already on the page, so it needs no route and
// no second trip to the database.
export function Download({ rows }: { rows: Row[] }) {
  function take() {
    const head = "email,source,signed_up\n";
    const body = rows
      .map((r) =>
        [r.email, r.source ?? "", r.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    // A BOM, because without one Excel mangles anything accented.
    const blob = new Blob(["﻿" + head + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn btn-sm" type="button" onClick={take}>
      Take a copy
    </button>
  );
}
