import Link from "next/link";

// The menu behind the More tab on small screens. A real page rather than
// a hidden strip of links, because on a phone that is what people open.
export function MenuList({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <div className="divide">
      {items.map(([href, label]) => (
        <Link className="li linkrow" href={href} key={href + label}>
          <div>
            <b>{label}</b>
          </div>
          <div className="rowmeta">
            <span className="muted small">Open</span>
          </div>
        </Link>
      ))}
    </div>
  );
}