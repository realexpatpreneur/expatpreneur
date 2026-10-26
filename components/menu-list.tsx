import Link from "next/link";

// The menu behind the menu button. A real page rather than a hidden strip
// of links, because on a phone that is what people open.
//
// Takes either a flat list of links, which is what the member menus pass,
// or groups, which the public menu uses so it reads the way the footer does.

export type MenuGroup = { title: string; items: [string, string][] };

function Chevron() {
  return (
    <svg className="epm-chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Rows({ items }: { items: [string, string][] }) {
  return (
    <ul className="epm-list">
      {items.map(([href, label]) => (
        <li key={href + label}>
          <Link className="epm-row" href={href}>
            <span>{label}</span>
            <Chevron />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MenuList({
  items,
  groups,
}: {
  items?: [string, string][];
  groups?: MenuGroup[];
}) {
  if (groups) {
    return (
      <div className="epm">
        {groups.map((g) => (
          <section className="epm-group" key={g.title}>
            <h2 className="epm-title">{g.title}</h2>
            <Rows items={g.items} />
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="epm">
      <section className="epm-group">
        <Rows items={items ?? []} />
      </section>
    </div>
  );
}
