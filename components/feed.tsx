import Link from "next/link";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

export type FeedItem = {
  who: string;
  role?: string | null;
  when: string;
  kind: string;
  tone: "blue" | "mint" | "sun" | "navy";
  text: string;
  embedTitle?: string | null;
  embedLine?: string | null;
  href?: string;
  actions?: [string, string][];
};

// fpost: who wrote it, what kind of thing it is, the line itself, then
// the thing it points at.
export function FeedPost({ item }: { item: FeedItem }) {
  return (
    <article className="fpost">
      <div className="fp-head">
        <Av name={item.who} className="av-sm" />
        <div className="fp-who">
          <b>{item.who}</b>
          {item.role ? <span>{item.role}</span> : null}
        </div>
        <span className={`fp-kind fk-${item.tone}`}>{item.kind}</span>
      </div>
      <p className="fp-text">{item.text}</p>
      {item.embedTitle && item.href ? (
        <Link className="fp-embed" href={item.href}>
          <b>{item.embedTitle}</b>
          {item.embedLine ? <span>{item.embedLine}</span> : null}
        </Link>
      ) : null}
      <div className="fp-foot">
        <span>{item.when}</span>
        {(item.actions ?? []).map(([label, href]) => (
          <Link key={label} href={href}>
            {label}
          </Link>
        ))}
      </div>
    </article>
  );
}

// The line at the top of the feed that opens the posting form.
export function Compose({ name }: { name: string }) {
  return (
    <div className="fcompose">
      <Av name={name} className="av-sm" />
      <Link className="fcompose-box" href="/village/new">
        Ask for something, or offer what you can
      </Link>
      <Link className="btn btn-ghost btn-sm" href="/village/new">
        Post
      </Link>
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
}: {
  href: string;
  day: string;
  month: string;
  title: string;
  line: string;
  visiting?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Link className="evt linkrow" href={href}>
      <div className={`date ${visiting ? "visit" : ""}`}>
        <b>{day}</b>
        <span>{month}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>{title}</b>
        <div className="muted small">{line}</div>
      </div>
      {right}
    </Link>
  );
}