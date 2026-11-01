import Link from "next/link";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

export type FeedItem = {
  who: string;
  avatar?: string | null;
  role?: string | null;
  when: string;
  kind: string;
  tone: "blue" | "mint" | "sun" | "navy";
  text: string;
  embedTitle?: string | null;
  embedLine?: string | null;
  href?: string;
  image?: string | null;
  actions?: [string, string][];
};

// The colour a kind of post is labelled in, the same four the public
// pages use for Ask, Offer, introductions and events.
const kindClass = (kind: string) =>
  kind === "Ask"
    ? "m-ask"
    : kind === "Offer"
      ? "m-offer"
      : kind === "Introduction"
        ? "m-intro"
        : "m-event";

// One post in the feed: who wrote it, what kind of thing it is, the
// title, the words, then what you can do about it.
export function FeedPost({ item }: { item: FeedItem }) {
  return (
    <article className="m-post">
      <Av name={item.who} src={item.avatar ?? null} />
      <div style={{ minWidth: 0 }}>
        <div className="m-meta">
          <b>{item.who}</b>
          {item.role ? <span className="m-muted">{item.role}</span> : null}
          <span className="m-muted">{item.when}</span>
        </div>
        <span className={`m-kind ${kindClass(item.kind)}`} style={{ display: "inline-block", marginTop: 6 }}>
          {item.kind}
        </span>
        {item.embedTitle ? (
          <h3>{item.href ? <Link href={item.href}>{item.embedTitle}</Link> : item.embedTitle}</h3>
        ) : null}
        {item.image && item.href ? (
          <Link className="d-zoom" href={item.href} style={{ display: "block", marginTop: 14, borderRadius: 6, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.embedTitle ?? ""} style={{ display: "block", width: "100%", height: 260, objectFit: "cover" }} />
          </Link>
        ) : null}
        {item.text ? <p>{item.text}</p> : null}
        <div className="m-acts">
          {(item.actions ?? []).map(([label, href]) => (
            <Link key={label} className="m-act" href={href}>
              {label}
            </Link>
          ))}
          {item.embedLine ? (
            <span className="m-muted" style={{ fontSize: 13, marginLeft: 4 }}>
              {item.embedLine}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// The box at the top of the feed that opens the posting form, already
// set to an Ask or an Offer if that is the half you click.
export function Compose({
  name,
  avatar = null,
}: {
  name: string;
  avatar?: string | null;
}) {
  return (
    <div className="m-compose">
      <Av name={name} src={avatar} />
      <Link href="/village/new" style={{ flex: 1, minWidth: 0, color: "inherit" }}>
        What do you need this week, or what can you give?
      </Link>
      <span className="m-go">
        <Link href="/village/new?kind=ask">
          <span style={{ background: "#FEEEEC", color: "#8B3A30" }}>Ask</span>
        </Link>
        <Link href="/village/new?kind=offer">
          <span style={{ background: "#E6F4F1", color: "#24675A" }}>Offer</span>
        </Link>
      </span>
    </div>
  );
}

// wa: the row that leads out to a WhatsApp group.
export function WaRow({
  title,
  sub,
  background,
  colour,
  icon,
  href,
}: {
  title: string;
  sub: string;
  background: string;
  colour: string;
  icon: string;
  href: string;
}) {
  return (
    <div className="wa">
      <span className="kind" style={{ background, color: colour }}>
        <Ic name={icon} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b className="trunc" style={{ display: "block", fontWeight: 600 }}>
          {title}
        </b>
        <span className="muted small">{sub}</span>
      </div>
      <Link className="btn btn-mint btn-sm" href={href}>
        Open
      </Link>
    </div>
  );
}

// evt: a date block, the name of the event, and where it is.
export function EventRow({
  href,
  day,
  month,
  title,
  line,
  visiting = false,
  right,
  cover,
  wrap,
}: {
  href: string;
  day: string;
  month: string;
  title: string;
  line: string;
  visiting?: boolean;
  right?: React.ReactNode;
  cover?: string | null;
  wrap?: string;
}) {
  return (
    <Link
      className={`evt linkrow ${cover ? "has-thumb" : ""}`}
      data-el={wrap}
      href={href}
    >
      <div className={`date ${visiting ? "visit" : ""}`}>
        <b>{day}</b>
        <span>{month}</span>
      </div>
      {/* The thumbnail the prototype puts on every event row. */}
      {cover ? (
        <span
          className="evt-thumb"
          role="img"
          aria-label={title}
          style={{ backgroundImage: `url('${cover}')` }}
        />
      ) : null}
      <div style={{ minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>{title}</b>
        <div className="muted small">{line}</div>
      </div>
      {right}
    </Link>
  );
}