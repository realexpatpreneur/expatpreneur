"use client";

import { useActionState } from "react";
import { savePage, addBlock, setPageStatus, type PageState } from "./actions";
import { blockLabel, type Block } from "@/lib/blocks";
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
          {page.blocks.map((block, i) => (
            <div className="panel" key={i}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>{blockLabel[block.type] ?? block.type}</h3>
                <label className="check" style={{ margin: 0 }}>
                  <input type="checkbox" name={`block_${i}_remove`} />
                  <span>
                    <small>Remove this block</small>
                  </span>
                </label>
              </div>
              <input type="hidden" name={`block_${i}_type`} value={block.type} />

              {block.type === "hero" ? (
                <>
                  <label className="field">
                    <span>Heading</span>
                    <input name={`block_${i}_heading`} defaultValue={block.heading ?? ""} />
                  </label>
                  <label className="field">
                    <span>Text</span>
                    <textarea
                      name={`block_${i}_text`}
                      rows={2}
                      defaultValue={block.text ?? ""}
                    />
                  </label>
                  <div className="g2">
                    <label className="field">
                      <span>Button</span>
                      <input
                        name={`block_${i}_button_label`}
                        defaultValue={block.button_label ?? ""}
                      />
                    </label>
                    <label className="field">
                      <span>Button goes to</span>
                      <input
                        name={`block_${i}_button_href`}
                        defaultValue={block.button_href ?? ""}
                      />
                    </label>
                  </div>
                  <div className="g2">
                    <label className="field">
                      <span>Second button</span>
                      <input
                        name={`block_${i}_second_label`}
                        defaultValue={block.second_label ?? ""}
                      />
                    </label>
                    <label className="field">
                      <span>Second button goes to</span>
                      <input
                        name={`block_${i}_second_href`}
                        defaultValue={block.second_href ?? ""}
                      />
                    </label>
                  </div>
                  <Uploader
                    name={`block_${i}_image_url`}
                    folder="pages"
                    label="Image"
                    current={block.image_url}
                  />
                </>
              ) : null}

              {block.type === "heading" ? (
                <label className="field">
                  <span>Heading</span>
                  <input name={`block_${i}_heading`} defaultValue={block.heading ?? ""} />
                </label>
              ) : null}

              {block.type === "text" ? (
                <label className="field">
                  <span>Text</span>
                  <textarea
                    name={`block_${i}_body`}
                    rows={4}
                    defaultValue={block.body ?? ""}
                  />
                </label>
              ) : null}

              {block.type === "villages" ? (
                <label className="field">
                  <span>Show</span>
                  <select
                    name={`block_${i}_show`}
                    defaultValue={block.show ?? "Open and launching Villages"}
                  >
                    <option>Open and launching Villages</option>
                    <option>Open only</option>
                  </select>
                </label>
              ) : null}

              {block.type === "story" ? (
                <>
                  <label className="field">
                    <span>Heading</span>
                    <input name={`block_${i}_heading`} defaultValue={block.heading ?? ""} />
                  </label>
                  <label className="field">
                    <span>The story</span>
                    <textarea
                      name={`block_${i}_body`}
                      rows={4}
                      defaultValue={block.body ?? ""}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ))}

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
        <option value="hero">Hero</option>
        <option value="heading">Heading</option>
        <option value="text">Text</option>
        <option value="villages">Villages</option>
        <option value="story">Founder story</option>
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