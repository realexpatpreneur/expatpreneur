"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavGroup = { heading?: string; links: [string, string][] };

// The prototype's signed-in chrome: an icon rail for switching workspace,
// a side navigation for the one you are in, and the page beside them.
// Both are fixed, so a page needs no wrapper of its own.
export function WorkspaceShell({
  rail,
  groups,
  title,
  subtitle,
}: {
  rail: [string, string, string][]; // href, short mark, name
  groups: NavGroup[];
  title: string;
  subtitle?: string;
}) {
  const path = usePathname();

  const active = (href: string) =>
    href === path || (href !== "/" && path.startsWith(href + "/"));

  // The longest matching link wins, so /admin does not light up on
  // /admin/members.
  const current = groups
    .flatMap((g) => g.links)
    .map(([href]) => href)
    .filter((href) => href === path || path.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <>
      <aside className="rail" aria-label="Workspaces">
        {rail.map(([href, mark, name]) => (
          <Link
            className={`rail-tile ${active(href) ? "on" : ""}`}
            href={href}
            key={href + name}
            title={name}
            aria-label={name}
          >
            {mark}
          </Link>
        ))}
      </aside>

      <nav className="mside" aria-label={title}>
        <div className="side-head">
          <b>{title}</b>
          {subtitle ? <span className="muted small">{subtitle}</span> : null}
        </div>

        {groups.map((group, i) => (
          <div key={group.heading ?? i}>
            {group.heading ? (
              <div className="navlabel">{group.heading}</div>
            ) : null}
            {group.links.map(([href, label]) => (
              <Link
                className={`nav ${href === current ? "on" : ""}`}
                href={href}
                key={href + label}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}