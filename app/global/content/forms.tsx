"use client";

import { useActionState } from "react";
import { savePage, addBlock, setPageStatus, type PageState } from "./actions";
import {
  BLOCKS,
  blockLabel,
  blockSpec,
  type Block,
  type BlockField as BlockFieldSpec,
} from "@/lib/blocks";
import { RichText } from "@/components/rich-text";
import { Uploader } from "@/components/uploader";

export function PageEditor({
  page,
}: {
  page: {
    slug: string;
    title: string;
    path: string;
    blocks: Block[];
    search_title: string | null;
    search_description: string | null;
    status: string;
  };
}) {
  const [state, action, pending] = useActionState<PageState, FormData>(
    savePage,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="slug" value={page.slug} />
      <input type="hidden" name="block_count" value={page.blocks.length} />

      <div className="gside">
        <div className="stack">
          {page.blocks.map((block, i) => {
            const spec = blockSpec(block.type);
            return (
              <div className="panel" key={i}>
                <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div>
                    <h3>{blockLabel[block.type] ?? block.type}</h3>
                    {spec ? (
                      <p className="muted small" style={{ marginTop: 2 }}>
                        {spec.about}
                      </p>
                    ) : null}
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {/* The order is a number on each block, so moving one
                        is arithmetic rather than dragging. */}
                    <input
                      className="blockpos"
                      name={`block_${i}_pos`}
                      type="number"
                      min={1}
                      defaultValue={i + 1}
                      aria-label="Position on the page"
                      title="Position on the page"
                    />
                    <label className="check" style={{ margin: 0 }}>
                      <input type="checkbox" name={`block_${i}_remove`} />
                      <span>
                        <small>Remove</small>
                      </span>
                    </label>
                  </div>
                </div>
                <input type="hidden" name={`block_${i}_type`} value={block.type} />

                <div className="stack" style={{ marginTop: 12 }}>
                  {(spec?.fields ?? []).map((f) => (
                    <BlockField
                      key={f.name}
                      field={f}
                      name={`block_${i}_${f.name}`}
                      value={block[f.name] ?? ""}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {page.blocks.length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                No blocks yet. Add one, and this page starts showing what you
                write here instead of what is in the code.
              </p>
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div className="panel">
            <h3>This page</h3>
            <label className="field">
              <span>Title</span>
              <input name="title" defaultValue={page.title} />
            </label>
            <label className="field">
              <span>Address</span>
              <input name="path" defaultValue={page.path} />
              <span className="hint">
                Where it lives. Changing this does not move the page yet.
              </span>
            </label>
            <label className="field">
              <span>Search title</span>
              <input name="search_title" defaultValue={page.search_title ?? ""} />
            </label>
            <label className="field">
              <span>Search description</span>
              <textarea
                name="search_description"
                rows={2}
                defaultValue={page.search_description ?? ""}
              />
            </label>
          </div>

          <div className="panel">
            <div className="row">
              <button
                className="btn btn-ghost"
                type="submit"
                name="intent"
                value="save"
                disabled={pending}
              >
                {pending ? "Saving" : "Save as draft"}
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                name="intent"
                value="publish"
                disabled={pending}
              >
                {pending ? "Publishing" : "Publish"}
              </button>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              A draft changes nothing on the site. Publishing makes this page
              show what is written here.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

function BlockField({
  field,
  name,
  value,
}: {
  field: BlockFieldSpec;
  name: string;
  value: string;
}) {
  if (field.kind === "image")
    return (
      <Uploader
        name={name}
        label={field.label}
        hint={field.hint}
        current={value}
      />
    );

  if (field.kind === "long")
    return (
      <div className="field">
        <span>{field.label}</span>
        <RichText name={name} defaultValue={value} rows={4} />
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </div>
    );

  if (field.kind === "select")
    return (
      <label className="field">
        <span>{field.label}</span>
        <select name={name} defaultValue={value}>
          {(field.options ?? []).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </label>
    );

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        name={name}
        type={field.kind === "number" ? "number" : "text"}
        defaultValue={value}
      />
      {field.hint ? <span className="hint">{field.hint}</span> : null}
    </label>
  );
}

export function AddBlockForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<PageState, FormData>(
    addBlock,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="slug" value={slug} />
      <select name="type" defaultValue="text">
        {BLOCKS.map((b) => (
          <option key={b.type} value={b.type}>
            {b.label}
          </option>
        ))}
      </select>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add a block"}
      </button>
    </form>
  );
}

export function StatusButton({
  slug,
  status,
}: {
  slug: string;
  status: string;
}) {
  const [, action, pending] = useActionState<PageState, FormData>(
    setPageStatus,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input
        type="hidden"
        name="status"
        value={status === "live" ? "draft" : "live"}
      />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {status === "live" ? "Take it back to draft" : "Publish"}
      </button>
    </form>
  );
}