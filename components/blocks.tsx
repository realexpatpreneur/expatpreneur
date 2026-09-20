import Link from "next/link";
import type { Block } from "@/lib/blocks";

// Renders the blocks a page is made of. Anything the editor can make, this
// can show.
export function Blocks({
  blocks,
  villages,
}: {
  blocks: Block[];
  villages?: { slug: string; name: string; city: string; country: string; status: string; summary: string | null }[];
}) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "hero") {
          return (
            <section className="band" key={i}>
              <h1>{block.heading}</h1>
              {block.text ? <p className="lead">{block.text}</p> : null}
              {block.image_url ? (
                <div className="shot" style={{ marginTop: 16 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.image_url} alt="" />
                </div>
              ) : null}
              <p>
                {block.button_label ? (
                  <Link className="btn primary" href={block.button_href ?? "/apply"}>
                    {block.button_label}
                  </Link>
                ) : null}{" "}
                {block.second_label ? (
                  <Link className="btn" href={block.second_href ?? "/discover"}>
                    {block.second_label}
                  </Link>
                ) : null}
              </p>
            </section>
          );
        }

        if (block.type === "heading") {
          return (
            <section className="band" key={i}>
              <h2>{block.heading}</h2>
            </section>
          );
        }

        if (block.type === "text") {
          return (
            <section className="band" key={i}>
              <p className="lead" style={{ whiteSpace: "pre-wrap" }}>
                {block.body}
              </p>
            </section>
          );
        }

        if (block.type === "story") {
          return (
            <section className="band" key={i}>
              <div className="panel wash">
                {block.heading ? <h3>{block.heading}</h3> : null}
                <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{block.body}</p>
              </div>
            </section>
          );
        }

        if (block.type === "villages") {
          const shown = (villages ?? []).filter((village) =>
            block.show === "Open only"
              ? village.status === "open"
              : ["open", "launching", "exploring"].includes(village.status)
          );

          return (
            <section className="band" key={i}>
              <h2>The Villages</h2>
              <div className="grid" style={{ marginTop: 16 }}>
                {shown.map((village) => (
                  <Link className="card" href={`/villages/${village.slug}`} key={village.slug}>
                    <div className="cover blue">{village.city}</div>
                    <div className="kind">{village.country}</div>
                    <p>{village.summary}</p>
                    <div className="meta">
                      <span className="chip">
                        {village.status === "open"
                          ? "Open, by invitation"
                          : village.status === "launching"
                            ? "Launching"
                            : "Being explored"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </>
  );
}