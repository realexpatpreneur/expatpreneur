import Link from "next/link";
import { Ic } from "@/components/icon";

// stat: a figure with its label above and a line of context below.
export function Stat({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: number | string;
  note?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span>{label}</span>
      <b>{value}</b>
      {note ? <span>{note}</span> : null}
    </>
  );
  return href ? (
    <Link className="stat linkrow" href={href}>
      {inner}
    </Link>
  ) : (
    <div className="stat">{inner}</div>
  );
}

// task: a tick box, what needs doing, and which part of the work it is.
const TASK_CHIP: Record<string, string> = {
  WhatsApp: "chip-mint",
  Curation: "chip-blue",
  Circles: "chip-sun",
  Reports: "chip-pink",
};

export function Task({
  title,
  sub,
  tag,
  href,
}: {
  title: string;
  sub?: string;
  tag?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="tick" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>{title}</b>
        {sub ? <p className="muted small">{sub}</p> : null}
      </div>
      {tag ? (
        <span className={`chip hide-m ${TASK_CHIP[tag] ?? ""}`}>{tag}</span>
      ) : null}
    </>
  );
  return href ? (
    <Link className="task linkrow" href={href}>
      {inner}
    </Link>
  ) : (
    <div className="task">{inner}</div>
  );
}

// cap: how full something is, with the bar turning amber near the top.
export function Cap({
  name,
  value,
  max,
}: {
  name: string;
  value: number;
  max: number;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const near = pct >= 95;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b style={{ fontWeight: 600 }}>{name}</b>
        <span
          className={`small ${near ? "" : "muted"}`}
          style={near ? { color: "#B8691F", fontWeight: 700 } : undefined}
        >
          {value} of {max}
        </span>
      </div>
      <div className="bar" style={{ marginTop: 6 }}>
        <i
          style={{
            width: `${pct}%`,
            background: near ? "var(--sun)" : "var(--blue)",
          }}
        />
      </div>
    </div>
  );
}

// flag: the green note when something is fine, amber when it is not.
export function Flag({
  ok = false,
  children,
}: {
  ok?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flag ${ok ? "ok" : "hold"}`}>
      <Ic name={ok ? "check" : "flag"} />
      <span>{children}</span>
    </div>
  );
}

// sechead: a heading with a link to the page that handles it.
export function SecHead({
  title,
  href,
  label,
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="sechead">
      <h3>{title}</h3>
      {href ? (
        <Link className="small" style={{ fontWeight: 600 }} href={href}>
          {label ?? "Manage"}
        </Link>
      ) : null}
    </div>
  );
}

// tablewrap: a table that scrolls sideways rather than squashing.
export function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="tablewrap">
      <table className="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// mixrow: how big a share one nationality is, with the limit marked on
// the bar. Internal only, as the prototype says on the page itself.
export function MixRow({
  name,
  count,
  percent,
  limit,
  scale = 40,
}: {
  name: string;
  count: number;
  percent: number;
  limit: number;
  scale?: number;
}) {
  const near = percent >= limit - 3;
  return (
    <div className="mixrow">
      <b style={{ fontWeight: 600 }}>
        {name}{" "}
        <span className="muted small" style={{ fontWeight: 400 }}>
          {count}
        </span>
      </b>
      <div className="mixbar">
        <i
          className={near ? "near" : ""}
          style={{ width: `${Math.min(100, (percent / scale) * 100)}%` }}
        />
        <u style={{ left: `${(limit / scale) * 100}%` }} />
      </div>
      <span
        className="pct"
        style={{ fontWeight: 600, color: near ? "#B8691F" : undefined }}
      >
        {percent.toFixed(1)}%
      </span>
      <span className="limitcell">{limit}%</span>
    </div>
  );
}