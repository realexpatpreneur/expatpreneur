import Link from "next/link";
import { Ic } from "@/components/icon";

// The prototype's lock(). A sun-coloured line that says what is behind
// Village Membership and offers the one way through. Seven screens use it
// there; one page here had it written out by hand.
//
// The bold line is the message. The small line and the button carry the
// prototype's words unless a page needs its own.
export function Lock({
  children,
  note = "Included with Village Membership.",
  cta = "See Village Membership",
  href = "/upgrade",
  style,
}: {
  children: React.ReactNode;
  note?: string;
  cta?: string;
  href?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="lockline" style={style}>
      <Ic name="lock" />
      <div style={{ flex: 1 }}>
        <b style={{ display: "block" }}>{children}</b>
        {note ? <span className="small">{note}</span> : null}
      </div>
      <Link className="btn btn-sm btn-dark" href={href}>
        {cta}
      </Link>
    </div>
  );
}