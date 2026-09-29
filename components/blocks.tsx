import Link from "next/link";
import {
  pairs,
  styleOf,
  elementCss,
  touchedElements,
  inOrder,
  kidsOf,
  type Block,
} from "@/lib/blocks";
import { toHtml } from "@/components/rich-text";
import { VillageCard, BusinessCard, CourseCard, ArticleCard, type BusinessRow } from "@/components/cards";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
import { Filtered, Searchable } from "@/components/filtered";
import { HeroPreview, Av } from "@/components/bits";
import { whenText } from "@/lib/events";

// Everything the block editor can make, drawn. Blocks that show live
// things are given the rows by the page, so one query serves the page
// however many blocks use it.
export type BlockData = {
  villages?: {
    slug: string; name: string; city: string; country: string;
    status: string; summary: string | null; cover_url?: string | null;
    members?: number | null; circles?: number | null;
  }[];
  events?: {
    id: string; slug: string; title: string; starts_at: string;
    ends_at?: string | null; timezone?: string; venue: string | null;
    cover_url?: string | null; visibility?: string; village_name?: string | null;
  }[];
  businesses?: BusinessRow[];
  courses?: { id: string; slug: string; title: string; level?: string | null; format?: string | null; price_cents?: number | null; currency?: string | null; cover_url?: string | null }[];
  articles?: { id: string; slug: string; title: string; standfirst: string | null; kind?: string; cover_url?: string | null }[];
  plans?: { slug: string; name: string; blurb: string | null; price_cents: number; currency: string; interval: string; features: string[] }[];
  people?: { id: string; full_name: string; headline: string | null; industry?: string | null; avatar_url?: string | null }[];
  media?: { id: string; slug: string; kind: string; title: string; summary?: string | null; duration?: string | null; cover_url?: string | null }[];
  shows?: { slug: string; name: string; about: string | null; cover_url?: string | null }[];
};

const TONES: Record<string, string> = {
  wash: "panel-wash", navy: "band", blue: "band", pink: "ct-pink", mint: "ct-mint",
};

export function Blocks({ blocks, data = {} }: { blocks: Block[]; data?: BlockData }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Styled key={i} block={b}>
          <One block={b} data={data} />
        </Styled>
      ))}
    </>
  );
}

const SPACE: Record<string, string> = { tight: "18px 0", roomy: "72px 0", none: "0" };
const SIZE: Record<string, string> = { large: "1.25em", small: "0.85em" };
const WIDE: Record<string, string> = { narrow: "720px", wide: "none" };

// The settings every block carries, written as real CSS with the two
// breakpoints, so a block can sit differently on a phone than on a
// desktop. A block with nothing set writes no CSS at all.
function rules(b: Block, device: string) {
  const get = (name: string) => styleOf(b, name, device);
  const out: string[] = [];
  const inner: string[] = [];

  if (get("space")) out.push(`padding:${SPACE[get("space") as string]}`);
  if (get("align") === "center") out.push("text-align:center");
  if (get("size")) out.push(`font-size:${SIZE[get("size") as string]}`);
  if (get("hide") === "1") out.push("display:none");

  const w = get("width");
  if (w) inner.push(`max-width:${WIDE[w as string]};margin-left:auto;margin-right:auto`);

  return { out: out.join(";"), inner: inner.join(";") };
}

function Styled({ block: b, children }: { block: Block; children: React.ReactNode }) {
  const bg = b.bg === "custom" ? b.bg_custom : b.bg;
  const ink = b.ink === "custom" ? b.ink_custom : b.ink;

  const base = rules(b, "");
  const tablet = rules(b, "md");
  const phone = rules(b, "sm");

  const plain =
    !bg && !ink && !base.out && !base.inner &&
    !tablet.out && !tablet.inner && !phone.out && !phone.inner &&
    !b.round && !touchedElements(b).length;

  if (plain) return <>{children}</>;

  // One class per block, and the media queries beside it.
  const id = `b${Math.abs(hash(JSON.stringify(b)))}`;
  // The parts of this block that have been styled, on each screen.
  const parts = touchedElements(b);
  const partCss = (device: string) =>
    parts
      .map((el) => {
        const rule = elementCss(b, el, device);
        return rule ? `.${id} [data-el="${el}"]{${rule}}` : "";
      })
      .filter(Boolean)
      .join("");

  const css = [
    `.${id}{${[
      bg ? `background:${bg}` : "",
      ink ? `color:${ink}` : "",
      b.round === "soft" ? "border-radius:18px" : "",
      base.out,
    ].filter(Boolean).join(";")}}`,
    base.inner ? `.${id}>div{${base.inner}}` : "",
    partCss(""),
    tablet.out || tablet.inner || partCss("md")
      ? `@media (max-width:1024px){${tablet.out ? `.${id}{${tablet.out}}` : ""}${
          tablet.inner ? `.${id}>div{${tablet.inner}}` : ""
        }${partCss("md")}}`
      : "",
    phone.out || phone.inner || partCss("sm")
      ? `@media (max-width:620px){${phone.out ? `.${id}{${phone.out}}` : ""}${
          phone.inner ? `.${id}>div{${phone.inner}}` : ""
        }${partCss("sm")}}`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return (
    <div className={`blk ${id} ${ink ? "blk-ink" : ""}`}>
      <style>{css}</style>
      <div>{children}</div>
    </div>
  );
}

// A short, stable name for a block's own rules.
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return h;
}

function PeopleGrid({
  filters,
  people,
}: {
  filters?: string;
  people: { id: string; full_name: string; headline: string | null; industry?: string | null }[];
}) {
  const cards = people.map((p) => (
    <Link className="mcard" data-el="card" data-row={p.id} key={p.id} href={`/members/${p.id}`}>
      <div className="row">
        <Av name={p.full_name} />
        <div style={{ minWidth: 0 }}>
          <b style={{ fontWeight: 650, display: "block" }}>{p.full_name}</b>
          {p.headline ? <span className="where">{p.headline}</span> : null}
        </div>
      </div>
      {p.industry ? (
        <div className="tags">
          <span className="chip">{p.industry}</span>
        </div>
      ) : null}
    </Link>
  ));

  if (filters === "industry")
    return <Filtered chips={people.map((p) => p.industry ?? "Other")}>{cards}</Filtered>;

  return <div className="g3">{cards}</div>;
}

function SecHead({ heading, href }: { heading?: string; href?: string }) {
  if (!heading) return null;
  return (
    <div className="sechead">
      <h2 data-el="heading" style={{ fontSize: 20 }}>{heading}</h2>
      {href ? (
        <Link className="small" style={{ fontWeight: 600 }} href={href}>
          See all
        </Link>
      ) : null}
    </div>
  );
}

function One({ block: b, data }: { block: Block; data: BlockData }) {
  switch (b.type) {
    case "columns": {
      const count = Number(b.count) || 2;
      const kids = kidsOf(b);
      const gap = b.gap === "tight" ? 10 : b.gap === "roomy" ? 34 : 20;
      return (
        <section className="sec">
          <div
            className={`cols ${b.stack === "keep" ? "cols-keep" : ""}`}
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`, gap }}
          >
            {Array.from({ length: count }).map((_, c) => (
              <div className="col" data-el="col" key={c}>
                {(kids[c] ?? []).map((kid, n) => (
                  <Styled block={kid} key={n}>
                    <One block={kid} data={data} />
                  </Styled>
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "hero": {
      const art =
        b.art === "image" && b.image_url ? (
          <div
            className="photo"
            role="img"
            aria-label={b.heading ?? ""}
            style={{ height: 420, backgroundImage: `url('${b.image_url}')` }}
          />
        ) : b.art === "preview" ? (
          <HeroPreview />
        ) : null;

      const words = (
        <>
          <h1 data-el="heading">{b.heading}</h1>
          {b.text ? <p className="lead" data-el="text">{b.text}</p> : null}
          {b.button_label || b.second_label ? (
            <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
              {b.button_label ? (
                <Link className="btn btn-primary" data-el="button" href={b.button_href ?? "/apply"}>
                  {b.button_label}
                </Link>
              ) : null}
              {b.second_label ? (
                <Link className="btn btn-ghost" data-el="button2" href={b.second_href ?? "/discover"}>
                  {b.second_label}
                </Link>
              ) : null}
            </div>
          ) : null}
          {b.search ? (
            <label className="input dsearch" data-el="search" style={{ marginTop: 18 }}>
              <input placeholder={b.search} aria-label={b.search} />
            </label>
          ) : null}
          {b.quote ? <p className="proverb" data-el="quote">{b.quote}</p> : null}
        </>
      );

      // Centred means the words alone; otherwise the words sit beside
      // whatever was chosen for the right.
      if (b.layout === "center" || !art)
        return <section className="sec hero-center">{words}</section>;

      return (
        <section className="hero" style={{ padding: "48px 0" }}>
          <div>{words}</div>
          <div className="art">{art}</div>
        </section>
      );
    }

    case "heading":
      return (
        <section className="sec">
          <h2 data-el="heading" style={{ fontSize: 20 }}>{b.heading}</h2>
          {b.text ? <p className="intro" data-el="text">{b.text}</p> : null}
        </section>
      );

    case "text":
      return (
        <section className="sec">
          <div
            data-el="body"
            className={b.width === "narrow" ? "article" : ""}
            dangerouslySetInnerHTML={{ __html: toHtml(b.body ?? "") }}
          />
        </section>
      );

    case "panel":
      return (
        <section className="sec">
          <div data-el="box" className={`panel ${b.tone === "wash" ? "panel-wash" : ""}`}>
            {b.heading ? <h3 data-el="heading" style={{ fontSize: 15 }}>{b.heading}</h3> : null}
            {b.body ? (
              <div data-el="body" dangerouslySetInnerHTML={{ __html: toHtml(b.body) }} />
            ) : null}
            {b.button_label ? (
              <Link className="btn btn-ghost btn-sm" data-el="button" href={b.button_href ?? "/"}>
                {b.button_label}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case "band":
      return (
        <section className="sec">
          <div data-el="box" className={`band ${TONES[b.tone ?? ""] ?? ""}`}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 data-el="heading" style={{ fontSize: 22 }}>{b.heading}</h2>
              {b.text ? <p data-el="text" style={{ marginTop: 6 }}>{b.text}</p> : null}
            </div>
            {b.button_label ? (
              <Link className="btn btn-mint" data-el="button" href={b.button_href ?? "/apply"}>
                {b.button_label}
              </Link>
            ) : null}
            {b.second_label ? (
              <Link className="btn btn-ghost" data-el="button2" href={b.second_href ?? "/discover"}>
                {b.second_label}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case "image":
      return (
        <section className="sec">
          <div
            data-el="image"
            className="photo"
            role="img"
            aria-label={b.caption ?? ""}
            style={{ height: Number(b.height) || 320, backgroundImage: `url('${b.image_url ?? ""}')` }}
          />
          {b.caption ? (
            <p className="muted small" data-el="caption" style={{ marginTop: 8 }}>
              {b.caption}
            </p>
          ) : null}
        </section>
      );

    case "stats": {
      const cells = [1, 2, 3, 4]
        .map((n) => [b[`label_${n}`], b[`value_${n}`]] as [string | undefined, string | undefined])
        .filter(([label]) => label);
      if (!cells.length) return null;
      return (
        <section className="sec">
          <div className={`g3 ${cells.length === 4 ? "g4" : ""} stats3`}>
            {cells.map(([label, value]) => (
              <div className="stat" data-el="box" key={label}>
                <span data-el="label">{label}</span>
                <b data-el="value">{value}</b>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "steps":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <ol className="jpath" style={{ marginTop: 18 }}>
            {pairs(b.items).map(([title, text], n) => (
              <li className="jp-step" key={title} style={{ ["--i" as string]: n }}>
                <span className="jp-num" data-el="num">{n + 1}</span>
                <div className="jp-body">
                  <h3 data-el="title">{title}</h3>
                  {text ? <p data-el="text">{text}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case "features":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className={`g3 ${b.columns === "4" ? "g4" : ""}`} style={{ marginTop: 14 }}>
            {pairs(b.items).map(([title, text]) => (
              <div className="panel" data-el="box" key={title}>
                <h3 data-el="title" style={{ fontSize: 14 }}>{title}</h3>
                {text ? (
                  <p className="muted small" data-el="text" style={{ marginTop: 4 }}>
                    {text}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className="faq" style={{ marginTop: 10 }}>
            {pairs(b.items).map(([q, a]) => (
              <details key={q}>
                <summary data-el="q">{q}</summary>
                <p data-el="a">{a}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case "quotes":
      return (
        <section className="sec">
          {b.heading ? <h2 style={{ fontSize: 20 }}>{b.heading}</h2> : null}
          <div className="quotes" style={{ marginTop: 14 }}>
            {pairs(b.items).map(([quote, who]) => (
              <figure className="quote" data-el="box" key={quote}>
                <blockquote data-el="quote">{quote}</blockquote>
                <figcaption data-el="who">
                  <b>{who}</b>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );

    case "layers": {
      const items = pairs(b.items);
      const swatch = ["var(--mint)", "var(--blue)", "var(--navy)"];
      return (
        <section className="sec">
          {b.heading ? <h2>{b.heading}</h2> : null}
          {b.text ? <p className="intro">{b.text}</p> : null}
          <div className="layers layers-tint">
            {items.map(([name, text], n) => (
              <div className="layer" data-el="box" key={name}>
                <span className="swatch" style={{ background: swatch[n % 3] }} />
                <h3 data-el="title">{name}</h3>
                <p data-el="text">{text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "villages": {
      const list = inOrder(data.villages ?? [], b.order).filter((v) =>
        b.show === "open" ? v.status === "open" : b.show === "soon" ? v.status !== "open" : true
      );
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="g3">
            {list.map((v) => (
              <div data-el="card" data-row={v.slug} key={v.slug}>
                <VillageCard village={v} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "events": {
      let list = inOrder(data.events ?? [], b.order);
      if (b.scope === "public") list = list.filter((e) => e.visibility === "public");
      list = list.slice(0, Number(b.limit) || 4);
      if (!list.length) return null;
      const rows = list.map((e) => {
        const d = new Date(e.starts_at);
        return (
          <EventRow
            wrap="row"
            key={e.id}
            cover={e.cover_url}
            href={`/e/${e.slug}`}
            day={String(d.getDate())}
            month={d.toLocaleDateString("en-GB", { month: "short" })}
            title={e.title}
            line={`${whenText({
              starts_at: e.starts_at,
              ends_at: e.ends_at ?? null,
              timezone: e.timezone ?? "UTC",
            })}${e.venue ? `, ${e.venue}` : ""}`}
          />
        );
      });

      const chips =
        b.filters === "village"
          ? list.map((e) => e.village_name ?? "Online")
          : b.filters === "when"
            ? list.map((e) =>
                new Date(e.starts_at).toLocaleDateString("en-GB", { month: "long" })
              )
            : null;

      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="divide">
            {chips ? <Filtered chips={chips}>{rows}</Filtered> : rows}
          </div>
        </section>
      );
    }

    case "businesses": {
      const list = inOrder(data.businesses ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((x, n) => (
        <div data-el="card" data-row={x.slug} key={x.slug}>
          <BusinessCard biz={x} i={n} />
        </div>
      ));
      const chips = b.filters === "category" ? list.map((x) => x.category ?? x.industry ?? "Other") : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips as string[]}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "courses": {
      const list = inOrder(data.courses ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((c, n) => (
        <div data-el="card" data-row={c.slug} key={c.slug}>
          <CourseCard course={c} i={n} />
        </div>
      ));
      const chips =
        b.filters === "format"
          ? list.map((c) => (c.format === "live" ? "Live" : "Recorded"))
          : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "articles": {
      const list = inOrder(data.articles ?? [], b.order).slice(0, Number(b.limit) || 3);
      if (!list.length) return null;
      const cards = list.map((a, n) => (
        <div data-el="card" data-row={a.slug} key={a.slug}>
          <ArticleCard article={a} i={n} />
        </div>
      ));
      const chips = b.filters === "kind" ? list.map((a) => a.kind ?? "Story") : null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          {chips ? (
            <Filtered chips={chips}>{cards}</Filtered>
          ) : (
            <div className="g3">{cards}</div>
          )}
        </section>
      );
    }

    case "people": {
      const list = inOrder(data.people ?? [], b.order).slice(0, Number(b.limit) || 6);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <PeopleGrid filters={b.filters} people={list} />
        </section>
      );
    }

    case "videos": {
      let list = inOrder(data.media ?? [], b.order);
      if (b.kind) list = list.filter((m) => m.kind === b.kind);
      list = list.slice(0, Number(b.limit) || 8);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="vgrid">
            {list.map((m) => (
              <Link className="vitem" data-el="card" data-row={m.slug} key={m.id} href={`/watch/${m.slug}`}>
                <div
                  className="vthumb"
                  role="img"
                  aria-label={m.title}
                  style={m.cover_url ? { backgroundImage: `url('${m.cover_url}')` } : undefined}
                >
                  {m.duration ? <span className="vdur">{m.duration}</span> : null}
                </div>
                <div className="vtitle" style={{ marginTop: 10 }}>
                  {m.title}
                </div>
                {m.summary ? <div className="vsub">{m.summary}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "shows": {
      const list = inOrder(data.shows ?? [], b.order);
      if (!list.length) return null;
      return (
        <section className="sec">
          <SecHead heading={b.heading} href={b.more_href} />
          <div className="pshows">
            {list.map((sh) => (
              <Link className="pshow linkrow" data-el="card" data-row={sh.slug} key={sh.slug} href={`/watch/show/${sh.slug}`}>
                {sh.cover_url ? (
                  <div
                    className="photo"
                    role="img"
                    aria-label={sh.name}
                    style={{ height: 120, backgroundImage: `url('${sh.cover_url}')` }}
                  />
                ) : (
                  <span className="pcover">
                    <b>{sh.name}</b>
                  </span>
                )}
                <div>
                  <b style={{ fontSize: 15 }}>{sh.name}</b>
                  {sh.about ? (
                    <p className="muted small" style={{ marginTop: 4 }}>
                      {sh.about}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "form": {
      // The forms belong to their own pages, which hold the action and
      // the captcha. A block points at one rather than copying it.
      const where: Record<string, [string, string]> = {
        contact: ["/contact", "Open the contact form"],
        apply: ["/apply", "Request your invitation"],
        suggest: ["/villages/suggest", "Suggest a city"],
        newsletter: ["/media", "Sign up for the newsletter"],
      };
      const [href, label] = where[b.which ?? "contact"] ?? where.contact;
      return (
        <section className="sec">
          <div className="panel">
            {b.heading ? <h3 style={{ fontSize: 15 }}>{b.heading}</h3> : null}
            {b.text ? (
              <div dangerouslySetInnerHTML={{ __html: toHtml(b.text) }} />
            ) : null}
            <Link className="btn btn-primary" href={href} style={{ marginTop: 12 }}>
              {label}
            </Link>
          </div>
        </section>
      );
    }

    case "story":
      return (
        <section className="sec">
          <div className="story" data-el="box">
            <div
              data-el="image"
              className="img"
              role="img"
              aria-label={b.heading ?? ""}
              style={b.image_url ? { backgroundImage: `url('${b.image_url}')` } : undefined}
            />
            <div>
              <h3 data-el="heading" style={{ fontSize: 20, maxWidth: "28ch" }}>{b.heading}</h3>
              {b.body ? (
                <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
                  {b.body}
                </p>
              ) : null}
              {b.button_href ? (
                <Link className="btn btn-ghost btn-sm" href={b.button_href}>
                  Read the story
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      );

    case "plans": {
      const list = data.plans ?? [];
      if (!list.length) return null;
      return (
        <section className="sec memsec">
          {b.heading ? <h2>{b.heading}</h2> : null}
          {b.text ? <p className="intro">{b.text}</p> : null}
          <div className="plans">
            {list.map((p, n) => (
              <div className={`plan2 ${n === list.length - 1 ? "p2-best" : ""}`} data-el="card" key={p.slug}>
                <div className="p2-top">
                  <h3>{p.name}</h3>
                  <span className="p2-tag">{p.blurb}</span>
                </div>
                <div className="p2-price" data-el="price">
                  <b>
                    {p.price_cents
                      ? `${(p.price_cents / 100).toFixed(0)} ${p.currency}`
                      : "By application"}
                  </b>
                  <span>{p.price_cents ? `per ${p.interval}` : "Every request is read personally"}</span>
                </div>
                <ul className="p2-list">
                  {(p.features ?? []).map((f) => (
                    <li key={f}>
                      <Ic name="check" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}