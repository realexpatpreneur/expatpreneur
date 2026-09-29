"use client";

import { useState } from "react";
import { saveMenu, type MenuRow, type MenuState } from "./actions";
import { SITE_LINKS } from "@/lib/blocks";
import { Ic } from "@/components/icon";

export function MenuEditor({
  menus,
  items,
  pages,
}: {
  menus: [string, string][];
  items: MenuRow[];
  pages: { label: string; href: string; live: boolean }[];
}) {
  const [which, setWhich] = useState(menus[0][0]);
  const [rows, setRows] = useState<MenuRow[]>(items);
  const [state, setState] = useState<MenuState>({});
  const [saving, setSaving] = useState(false);

  const mine = rows
    .filter((r) => r.menu === which)
    .sort((a, b) => a.position - b.position);

  // Where a link can point: the pages that exist, then the rest of the
  // site, then anything typed by hand.
  const choices: [string, string][] = [
    ...pages.map((p) => [p.href, `${p.label}${p.live ? "" : " (draft)"}`] as [string, string]),
    ...SITE_LINKS.filter(([v]) => v && v !== "custom" && !pages.some((p) => p.href === v)),
  ];

  function change(i: number, patch: Partial<MenuRow>) {
    const all = [...rows];
    const index = rows.indexOf(mine[i]);
    all[index] = { ...all[index], ...patch };
    setRows(all);
    setState({});
  }

  function add() {
    setRows([
      ...rows,
      { menu: which, label: "", href: "", position: mine.length + 1, signed_in: "anyone" },
    ]);
  }

  function remove(i: number) {
    setRows(rows.filter((r) => r !== mine[i]));
  }

  function move(i: number, by: number) {
    const to = i + by;
    if (to < 0 || to >= mine.length) return;
    const order = [...mine];
    const [row] = order.splice(i, 1);
    order.splice(to, 0, row);
    const renumbered = order.map((r, n) => ({ ...r, position: n + 1 }));
    setRows([...rows.filter((r) => r.menu !== which), ...renumbered]);
  }

  async function save() {
    setSaving(true);
    setState(await saveMenu(which, mine));
    setSaving(false);
  }

  return (
    <div className="gside">
      <div>
        <div className="tabs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          {menus.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className="tabbtn"
              aria-current={which === id ? "page" : undefined}
              onClick={() => setWhich(id)}
            >
              {label.startsWith("Footer") ? label.replace("Footer, ", "") : "Header"}
            </button>
          ))}
        </div>

        <div className="stack">
          {mine.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted small" style={{ margin: 0 }}>
                Nothing in this menu yet. The site shows whatever the code
                has until you add something here.
              </p>
            </div>
          ) : null}

          {mine.map((row, i) => (
            <div className="panel" key={i}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <b>{row.label || "Untitled"}</b>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)}>
                    Up
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)}>
                    Down
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i)}>
                    Remove
                  </button>
                </div>
              </div>

              <div className="formgrid" style={{ marginTop: 12 }}>
                <label className="field">
                  <span>What it says</span>
                  <input
                    value={row.label}
                    onChange={(e) => change(i, { label: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Where it goes</span>
                  <select
                    value={choices.some(([v]) => v === row.href) ? row.href : "custom"}
                    onChange={(e) =>
                      change(i, { href: e.target.value === "custom" ? "" : e.target.value })
                    }
                  >
                    <option value="">Choose a page</option>
                    {choices.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                    <option value="custom">Somewhere else</option>
                  </select>
                </label>

                {!choices.some(([v]) => v === row.href) ? (
                  <label className="field full">
                    <span>The address</span>
                    <input
                      value={row.href}
                      placeholder="/somewhere or https://"
                      onChange={(e) => change(i, { href: e.target.value })}
                    />
                  </label>
                ) : null}

                <label className="field">
                  <span>Who sees it</span>
                  <select
                    value={row.signed_in ?? "anyone"}
                    onChange={(e) => change(i, { signed_in: e.target.value })}
                  >
                    <option value="anyone">Everybody</option>
                    <option value="visitors">Only people who are signed out</option>
                    <option value="members">Only members</option>
                  </select>
                </label>
              </div>
            </div>
          ))}

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={add}>
              <Ic name="plus" />
              Add a link
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving" : "Save this menu"}
            </button>
            {state.done ? <span className="chip chip-mint">Saved</span> : null}
            {state.error ? <span className="chip chip-sun">{state.error}</span> : null}
          </div>
        </div>
      </div>

      <aside className="panel panel-wash">
        <h3 style={{ fontSize: 14 }}>Making a new page findable</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Make the page under Pages, publish it, then add a link here
          pointing at it. A page that is still a draft appears in the list
          marked as one, so you can set the link up before it goes live.
        </p>
      </aside>
    </div>
  );
}