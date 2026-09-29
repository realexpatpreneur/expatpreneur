"use client";

import { useEffect, useState } from "react";
import {
  BLOCKS,
  COLOURS,
  SITE_LINKS,
  STYLE_FIELDS,
  DEVICES,
  PER_DEVICE,
  ELEMENTS,
  ELEMENT_FIELDS,
  elKey,
  isContainer,
  kidsOf,
  withKids,
  touchedElements,
  blockLabel,
  blockSpec,
  type Block,
  type BlockField,
} from "@/lib/blocks";
import { Blocks, type BlockData } from "@/components/blocks";
import { RichText } from "@/components/rich-text";
import { Uploader } from "@/components/uploader";
import { Ic } from "@/components/icon";
import { saveBlocks, type PageState } from "@/app/global/content/actions";

// The page, as a canvas. Blocks are shown as they will look, dragged
// to reorder, and clicked to edit. Nothing here is a numbered list of
// fields pretending to be a page.
export function PageBuilder({
  slug,
  title,
  path,
  status,
  initial,
  data,
}: {
  slug: string;
  title: string;
  path: string;
  status: string;
  initial: Block[];
  data: BlockData;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [past, setPast] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [device, setDevice] = useState("");
  const [picked, setPicked] = useState<number | null>(initial.length ? 0 : null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [row, setRow] = useState<{ block: number; name: string } | null>(null);
  const [inside, setInside] = useState<{ block: number; col: number; index: number } | null>(null);
  const [dragKid, setDragKid] = useState<{ block: number; col: number; index: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingTo, setAddingTo] = useState<{ block: number; col: number } | null>(null);
  const [tab, setTab] = useState<"content" | "style" | "element">("content");
  const [element, setElement] = useState<string>("");
  const [shut, setShut] = useState(false);
  const [state, setState] = useState<PageState>({});
  const [saving, setSaving] = useState(false);

  // Every change remembers what came before it, so it can be undone.
  const change = (next: Block[]) => {
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
    setState({});
  };

  function undo() {
    setPast((p) => {
      if (!p.length) return p;
      setFuture((f) => [blocks, ...f].slice(0, 50));
      setBlocks(p[p.length - 1]);
      return p.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (!f.length) return f;
      setPast((p) => [...p, blocks]);
      setBlocks(f[0]);
      return f.slice(1);
    });
  }

  useEffect(() => {
    function keys(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || e.key.toLowerCase() !== "z") return;
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    change(next);
    setPicked(to);
  }

  function nudge(i: number, by: number) {
    const to = Math.max(0, Math.min(blocks.length - 1, i + by));
    move(i, to);
  }

  function add(type: string, at?: number) {
    const b: Block = { type };
    const next = [...blocks];
    const where = at ?? blocks.length;
    next.splice(where, 0, b);
    change(next);
    setPicked(where);
    setAdding(false);
  }

  function remove(i: number) {
    const next = blocks.filter((_, n) => n !== i);
    change(next);
    setPicked(next.length ? Math.max(0, i - 1) : null);
  }

  function duplicate(i: number) {
    const next = [...blocks];
    next.splice(i + 1, 0, { ...blocks[i] });
    change(next);
    setPicked(i + 1);
  }

  // A per-screen setting is written under its own name, so the desktop
  // value stays put when the phone one changes.
  function fieldName(name: string) {
    return device && PER_DEVICE.includes(name) ? `${name}_${device}` : name;
  }

  // Element settings carry their own key, already worked out.
  function setRaw(i: number, key: string, value: string) {
    const next = blocks.map((b, n) => (n === i ? { ...b, [key]: value } : b));
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
  }

  function clearElement(i: number, el: string) {
    const next = blocks.map((b, n) => {
      if (n !== i) return b;
      const copy: Block = { ...b };
      for (const k of Object.keys(copy)) if (k.startsWith(`el.${el}.`)) delete copy[k];
      return copy;
    });
    change(next);
  }

  // Children of a container, and the one being edited inside it.
  function setKids(i: number, kids: Block[][]) {
    const next = blocks.map((b, n) => (n === i ? withKids(b, kids) : b));
    change(next);
  }

  function addKid(i: number, col: number, type: string) {
    const kids = kidsOf(blocks[i]);
    while (kids.length <= col) kids.push([]);
    kids[col] = [...(kids[col] ?? []), { type }];
    setKids(i, kids);
    setInside({ block: i, col, index: kids[col].length - 1 });
    setAdding(false);
  }

  function moveKid(
    i: number,
    from: { col: number; index: number },
    to: { col: number; index: number }
  ) {
    const kids = kidsOf(blocks[i]).map((c) => [...c]);
    while (kids.length <= Math.max(from.col, to.col)) kids.push([]);
    const [k] = kids[from.col].splice(from.index, 1);
    if (!k) return;
    kids[to.col].splice(to.index, 0, k);
    setKids(i, kids);
    setInside({ block: i, col: to.col, index: to.index });
  }

  function removeKid(i: number, col: number, index: number) {
    const kids = kidsOf(blocks[i]).map((c) => [...c]);
    kids[col].splice(index, 1);
    setKids(i, kids);
    setInside(null);
  }

  function setKidField(name: string, value: string) {
    if (!inside) return;
    const kids = kidsOf(blocks[inside.block]).map((c) => [...c]);
    const key = device && PER_DEVICE.includes(name) ? `${name}_${device}` : name;
    kids[inside.col][inside.index] = { ...kids[inside.col][inside.index], [key]: value };
    setKids(inside.block, kids);
  }

  function set(i: number, name: string, value: string) {
    const key = fieldName(name);
    const next = blocks.map((b, n) => (n === i ? { ...b, [key]: value } : b));
    setPast((p) => [...p.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
  }

  async function save(publish: boolean) {
    setSaving(true);
    const result = await saveBlocks({
      slug,
      blocks,
      status: publish ? "live" : "draft",
    });
    setState(result);
    setSaving(false);
  }

  // What the panel is editing: a block, or a child inside a container.
  const parent = picked != null ? blocks[picked] : null;
  const kid =
    inside && parent && isContainer(parent.type)
      ? kidsOf(parent)[inside.col]?.[inside.index] ?? null
      : null;
  const current = kid ?? parent;
  const spec = current ? blockSpec(current.type) : null;

  return (
    <div className="pb">
      <div className="pb-top">
        <div>
          <b>{title}</b>
          <span className="muted small">
            {path} {status === "live" ? "is live" : "is a draft"}
          </span>
        </div>
        <div className="pb-devices" role="group" aria-label="Screen">
          {DEVICES.map(([id, label]) => (
            <button
              type="button"
              key={id || "desktop"}
              className={device === id ? "on" : ""}
              onClick={() => setDevice(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={undo}
            disabled={!past.length}
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={redo}
            disabled={!future.length}
            title="Redo"
          >
            Redo
          </button>
          {state.done ? <span className="chip chip-mint">Saved</span> : null}
          {state.error ? <span className="chip chip-sun">{state.error}</span> : null}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => save(false)}
            disabled={saving}
          >
            Save as draft
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => save(true)}
            disabled={saving}
          >
            {saving ? "Saving" : "Publish"}
          </button>
        </div>
      </div>

      <div className={`pb-body ${shut ? "wide" : ""}`}>
        {/* The canvas */}
        <div
          className="pb-canvas"
          style={
            device
              ? {
                  width: DEVICES.find(([id]) => id === device)?.[2],
                  maxWidth: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }
              : undefined
          }
        >
          <div className="app">
            <div className="pub">
              {blocks.length === 0 ? (
                <div className="pb-empty">
                  <p className="muted">This page has no blocks yet.</p>
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}>
                    Add the first block
                  </button>
                </div>
              ) : null}

              {blocks.map((b, i) => (
                <div
                  key={i}
                  className={`pb-block ${picked === i ? "on" : ""} ${over === i ? "over" : ""}`}
                  onClick={(e) => {
                    setPicked(i);
                    if (!isContainer(b.type)) setInside(null);
                    // The part under the pointer, if it has a name.
                    const el = (e.target as HTMLElement).closest("[data-el]");
                    const name = el?.getAttribute("data-el") ?? "";
                    setElement(name);
                    if (name) setTab("element");
                  }}
                  draggable
                  onDragStart={(e) => {
                    // A card inside a list drags on its own, and moving
                    // one sets the order of that list.
                    const card = (e.target as HTMLElement)?.closest?.("[data-row]");
                    const name = card?.getAttribute("data-row");
                    if (name) {
                      setRow({ block: i, name });
                      e.stopPropagation();
                      return;
                    }
                    setDragging(i);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(i);
                  }}
                  onDragLeave={() => setOver((o) => (o === i ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();

                    // Dropped on a card: reorder the list.
                    const onto = (e.target as HTMLElement)?.closest?.("[data-row]");
                    const name = onto?.getAttribute("data-row");
                    if (row && row.block === i && name && name !== row.name) {
                      const names = [
                        ...(e.currentTarget.querySelectorAll("[data-row]") as NodeListOf<HTMLElement>),
                      ].map((n) => n.getAttribute("data-row") as string);
                      const from = names.indexOf(row.name);
                      const to = names.indexOf(name);
                      names.splice(to, 0, ...names.splice(from, 1));
                      setRaw(i, "order", names.join(","));
                      setRow(null);
                      setDragging(null);
                      setOver(null);
                      return;
                    }

                    if (dragging != null) move(dragging, i);
                    setRow(null);
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                >
                  <div className="pb-tools">
                    <span className="pb-grab" title="Drag to move">
                      <Ic name="move" />
                    </span>
                    <span className="pb-name">{blockLabel[b.type] ?? b.type}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); nudge(i, -1); }} title="Move up">
                      <Ic name="chevd" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); nudge(i, 1); }} title="Move down">
                      <Ic name="chevd" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); duplicate(i); }} title="Duplicate">
                      <Ic name="plus" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} title="Remove">
                      <Ic name="trash" />
                    </button>
                  </div>
                  <div className="pb-render pb-pick">
                    {isContainer(b.type) ? (
                      <Container
                        block={b}
                        data={data}
                        chosen={inside?.block === i ? inside : null}
                        onPick={(col, index) => {
                          setPicked(i);
                          setInside({ block: i, col, index });
                          setTab("content");
                        }}
                        onDragKid={(col, index) => setDragKid({ block: i, col, index })}
                        onDropKid={(col, index) => {
                          if (dragKid && dragKid.block === i)
                            moveKid(i, { col: dragKid.col, index: dragKid.index }, { col, index });
                          setDragKid(null);
                        }}
                        onAdd={(col) => {
                          setPicked(i);
                          setAddingTo({ block: i, col });
                          setAdding(true);
                        }}
                      />
                    ) : (
                      <Blocks blocks={[b]} data={data} />
                    )}
                  </div>
                  <button
                    type="button"
                    className="pb-insert"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdding(true);
                      setPicked(i);
                    }}
                    title="Add a block here"
                  >
                    <Ic name="plus" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What is selected. It folds away so the canvas has the room. */}
        <button
          type="button"
          className="pb-fold"
          onClick={() => setShut(!shut)}
          title={shut ? "Show the panel" : "Hide the panel"}
        >
          <Ic name="chev" />
          <span>{shut ? "Edit" : "Hide"}</span>
        </button>

        <aside className="pb-side" hidden={shut}>
          {adding ? (
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 14 }}>Add a block</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAdding(false);
                    setAddingTo(null);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="pb-palette">
                {BLOCKS.map((s) => (
                  <button
                    type="button"
                    key={s.type}
                    onClick={() =>
                      addingTo
                        ? addKid(addingTo.block, addingTo.col, s.type)
                        : add(s.type, picked == null ? undefined : picked + 1)
                    }
                  >
                    <b>{s.label}</b>
                    <span>{s.about}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : current && spec ? (
            <div className="panel">
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: 14 }}>
                    {kid ? `${spec.label}, inside the columns` : spec.label}
                  </h3>
                  <p className="muted small" style={{ marginTop: 2 }}>
                    {spec.about}
                  </p>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {kid ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        removeKid(picked as number, inside!.col, inside!.index)
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setAddingTo(null);
                      setAdding(true);
                    }}
                  >
                    Add a block
                  </button>
                </div>
              </div>

              <div className="pb-tabs">
                <button
                  type="button"
                  className={tab === "content" ? "on" : ""}
                  onClick={() => setTab("content")}
                >
                  Content
                </button>
                <button
                  type="button"
                  className={tab === "style" ? "on" : ""}
                  onClick={() => setTab("style")}
                >
                  Block
                </button>
                <button
                  type="button"
                  className={tab === "element" ? "on" : ""}
                  onClick={() => setTab("element")}
                >
                  Element
                </button>
              </div>

              {tab === "element" ? (
                <div className="pb-fields">
                  <label className="field">
                    <span>Which part</span>
                    <select value={element} onChange={(e) => setElement(e.target.value)}>
                      <option value="">Choose a part, or click one on the left</option>
                      {(ELEMENTS[current.type] ?? []).map((el) => (
                        <option key={el.name} value={el.name}>
                          {el.label}
                          {touchedElements(current).includes(el.name) ? " (changed)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {element ? (
                    <div className="stack" style={{ marginTop: 12 }}>
                      {ELEMENT_FIELDS.map((f) => (
                        <Field
                          key={f.name}
                          field={f}
                          device={device}
                          value={current[elKey(element, f.name, device)] ?? ""}
                          custom={current[elKey(element, `${f.name}_custom`)] ?? ""}
                          onChange={(v) =>
                            setRaw(picked as number, elKey(element, f.name, device), v)
                          }
                          onCustom={(v) =>
                            setRaw(picked as number, elKey(element, `${f.name}_custom`), v)
                          }
                        />
                      ))}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => clearElement(picked as number, element)}
                      >
                        Put this part back as designed
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="stack pb-fields" hidden={tab === "element"}>
                {spec.fields
                  .filter((f) =>
                    tab === "style"
                      ? STYLE_FIELDS.some((x) => x.name === f.name)
                      : !STYLE_FIELDS.some((x) => x.name === f.name)
                  )
                  .map((f) => (
                    <Field
                      key={f.name}
                      field={f}
                      value={
                        (device && PER_DEVICE.includes(f.name)
                          ? current[`${f.name}_${device}`]
                          : current[f.name]) ?? ""
                      }
                      custom={current[`${f.name}_custom`] ?? ""}
                      device={PER_DEVICE.includes(f.name) ? device : ""}
                      onChange={(v) =>
                        kid ? setKidField(f.name, v) : set(picked as number, f.name, v)
                      }
                      onCustom={(v) => set(picked as number, `${f.name}_custom`, v)}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="panel panel-wash">
              <p className="muted small" style={{ margin: 0 }}>
                Click a block on the left to edit it, drag one to move it, or
                add a new one.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setAdding(true)}
              >
                Add a block
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// A container on the canvas: its columns, its children, and the places
// a child can be dropped.
function Container({
  block,
  data,
  chosen,
  onPick,
  onDragKid,
  onDropKid,
  onAdd,
}: {
  block: Block;
  data: BlockData;
  chosen: { col: number; index: number } | null;
  onPick: (col: number, index: number) => void;
  onDragKid: (col: number, index: number) => void;
  onDropKid: (col: number, index: number) => void;
  onAdd: (col: number) => void;
}) {
  const count = Number(block.count) || 2;
  const kids = kidsOf(block);
  const gap = block.gap === "tight" ? 10 : block.gap === "roomy" ? 34 : 20;

  return (
    <section className="sec">
      <div
        className={`cols ${block.stack === "keep" ? "cols-keep" : ""}`}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`, gap }}
      >
        {Array.from({ length: count }).map((_, col) => (
          <div
            className="col"
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropKid(col, (kids[col] ?? []).length);
            }}
          >
            {(kids[col] ?? []).map((k, index) => (
              <div
                key={index}
                className={`pb-kid ${
                  chosen && chosen.col === col && chosen.index === index ? "on" : ""
                }`}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragKid(col, index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDropKid(col, index);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(col, index);
                }}
              >
                <Blocks blocks={[k]} data={data} />
              </div>
            ))}

            <button
              type="button"
              className="pb-addcol"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(col);
              }}
            >
              Add a block here
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  field,
  value,
  custom = "",
  device = "",
  onChange,
  onCustom,
}: {
  field: BlockField;
  value: string;
  custom?: string;
  device?: string;
  onChange: (v: string) => void;
  onCustom?: (v: string) => void;
}) {
  // A setting being written for one screen says so.
  const label = device
    ? `${field.label} (${device === "sm" ? "phone" : "tablet"})`
    : field.label;
  if (field.kind === "image")
    return (
      <div className="field">
        <Uploader
          name={`x_${field.name}`}
          label={label}
          hint={field.hint}
          current={value}
          onChange={onChange}
        />
        <input
          style={{ marginTop: 8 }}
          value={value}
          placeholder="Or paste the address of a picture"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );

  if (field.kind === "colour") {
    const picked = value === "custom";
    return (
      <div className="field">
        <span>{label}</span>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {COLOURS.map(([v, t]) =>
            v === "custom" ? null : (
              <button
                type="button"
                key={v || "none"}
                className={`pb-swatch ${value === v ? "on" : ""} ${v ? "" : "none"}`}
                style={v ? { background: v } : undefined}
                title={t}
                onClick={() => onChange(v)}
              />
            )
          )}
          <button
            type="button"
            className={`pb-swatch own ${picked ? "on" : ""}`}
            title="A colour of my own"
            style={picked && custom ? { background: custom } : undefined}
            onClick={() => onChange("custom")}
          >
            +
          </button>
        </div>
        {picked ? (
          <input
            type="color"
            style={{ marginTop: 8, height: 40, padding: 4 }}
            value={custom || "#2C3E50"}
            onChange={(e) => onCustom?.(e.target.value)}
          />
        ) : null}
      </div>
    );
  }

  if (field.kind === "link") {
    const known = SITE_LINKS.some(([v]) => v === value);
    return (
      <div className="field">
        <span>{label}</span>
        <select
          value={known ? value : "custom"}
          onChange={(e) => onChange(e.target.value === "custom" ? "" : e.target.value)}
        >
          {SITE_LINKS.map(([v, t]) => (
            <option key={v || "none"} value={v}>
              {t}
            </option>
          ))}
        </select>
        {!known || value === "custom" ? (
          <input
            style={{ marginTop: 8 }}
            value={value === "custom" ? "" : value}
            placeholder="https:// or /somewhere"
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );
  }

  if (field.kind === "long")
    return (
      <div className="field">
        <span>{label}</span>
        <RichText name={`x_${field.name}`} defaultValue={value} rows={4} onChange={onChange} />
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );

  if (field.kind === "select")
    return (
      <label className="field">
        <span>{label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
    );

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={field.kind === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.hint ? <span className="hint">{field.hint}</span> : null}
    </label>
  );
}