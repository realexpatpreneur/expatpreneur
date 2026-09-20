"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ic } from "@/components/icon";
import { Av } from "@/components/bits";
import {
  SPACES,
  TABS,
  OTHER_WORKSPACES,
  WORKSPACE_START,
  type Space,
} from "@/components/spaces";

// The rail, the sidebar and the bottom tabs. It reads the address
// itself, so the page it wraps does not have to say where it is.
export function WorkspaceNav({
  kind,
  name,
  dark,
}: {
  kind: string;
  name: string;
  dark: boolean;
}) {
  const path = usePathname() ?? "/";
  const spaces = SPACES[kind] ?? SPACES.member;

  const depth = (href: string) => (path === href ? 100 : path.startsWith(href + "/") ? href.length : 0);
  let here: Space = spaces[0];
  let best = 0;
  for (const sp of spaces) {
    for (const [href] of sp.items) {
      const d = depth(href);
      if (d > best) {
        best = d;
        here = sp;
      }
    }
  }

  const current = (href: string) => path === href || path.startsWith(href + "/");
  const tabs = TABS[kind] ?? TABS.member;

  return (
    <>
      {spaces.length > 1 ? (
        <nav className="rail" aria-label="Spaces">
          <Link className="rail-mark" href={WORKSPACE_START[kind] ?? "/home"} title="ExpatPreneurs">
            <span className={`mark${dark ? " alt" : ""}`} aria-hidden="true">
              EP
            </span>
          </Link>
          {spaces.map((sp) => (
            <Link
              key={sp.id}
              className={`rail-tile ${sp === here ? "on" : ""}`}
              href={sp.items[0][0]}
              title={sp.label}
              aria-label={sp.label}
            >
              <Ic name={sp.icon} />
              <span className="rail-tip">{sp.label}</span>
            </Link>
          ))}
          <div className="rail-foot">
            <Link className="rail-tile rail-you" href="/me" title={name} aria-label={name}>
              <Av name={name} className="av-sm" />
            </Link>
          </div>
        </nav>
      ) : null}

      <aside className="mside">
        <div className="side-head">
          <span className="side-ic">
            <Ic name={here.icon} />
          </span>
          <div>
            <b>{here.label}</b>
            <span>ExpatPreneurs</span>
          </div>
        </div>
        <nav className="side-nav">
          {here.items.map(([href, icon, label, count]) => (
            <Link
              key={href}
              className="nav"
              href={href}
              aria-current={current(href) ? "page" : undefined}
            >
              <Ic name={icon} />
              {label}
              {count ? <span className="count">{count}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="sidefoot">
          <span className="navlabel">Switch workspace</span>
          {OTHER_WORKSPACES.filter(([k]) => k !== kind).map(([k, icon, label]) => (
            <Link key={k} className="nav" href={WORKSPACE_START[k]}>
              <Ic name={icon} />
              {label}
            </Link>
          ))}
          {kind === "member" ? (
            <Link className="nav" href="/settings">
              <Ic name="gear" />
              Settings
            </Link>
          ) : null}
        </div>
      </aside>

      <nav className="mtabs">
        {tabs.map(([href, icon, label, count]) => (
          <Link key={href} href={href} aria-current={current(href) ? "page" : undefined}>
            <Ic name={icon} />
            {label}
            {count ? <span className="count">{count}</span> : null}
          </Link>
        ))}
      </nav>
    </>
  );
}