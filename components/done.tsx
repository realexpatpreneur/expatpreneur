import Link from "next/link";
import type { ReactNode } from "react";
import { Ic } from "@/components/icon";

type Action = {
  label: string;
  href: string;
  kind?: "primary" | "ghost" | "mint" | "dark";
};

// The prototype's done() block, as a component.
//
// Every "that worked" moment on the site is this shape: a tick in a
// circle, the heading, a line of reassurance, and the ways onward in a
// centred row. It was being rebuilt by hand on page after page, each
// slightly different, so submitting one form and submitting another
// landed you somewhere that looked unrelated.
export function Done({
  title,
  children,
  actions,
  icon = "check",
  warn = false,
  extra,
}: {
  title: string;
  children: ReactNode;
  actions: Action[];
  icon?: string;
  warn?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="done">
      <span className={warn ? "doneic warn" : "doneic"}>
        <Ic name={icon} />
      </span>
      <h1>{title}</h1>
      <p>{children}</p>
      {extra}
      <div
        className="row"
        style={{ justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}
      >
        {actions.map((a) => (
          <Link
            key={`${a.href}-${a.label}`}
            className={`btn btn-${a.kind ?? "ghost"}`}
            href={a.href}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}