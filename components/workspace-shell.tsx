import Link from "next/link";
import { currentMember } from "@/lib/member";
import { Ic } from "@/components/icon";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Av } from "@/components/bits";
import { SPACES, WORKSPACE_START } from "@/components/spaces";

// What the workspace calls itself on a phone, where the bar sits under
// the site header and repeating the wordmark would say nothing.
const WORKSPACE_NAME: Record<string, string> = {
  member: "Your space",
  admin: "Local Admin",
  global: "Global team",
  lead: "Leader tools",
  edu: "Educator",
};

// appShell, as the prototype builds it: a rail of spaces, the sidebar
// for the space you are in, a command bar, the page, and the tabs that
// appear in place of all of it on a phone.
export async function WorkspaceShell({
  kind = "member",
  nav,
  name,
  searchHref,
  searchText,
  switchTo,
  children,
}: {
  kind?: "member" | "admin" | "global" | "lead" | "edu";
  nav?: string;
  name?: string;
  searchHref?: string;
  searchText?: string;
  switchTo?: [string, string];
  children: React.ReactNode;
}) {
  // The shell knows who is signed in, so no page has to pass it along.
  // The same lookup the header and the page use, so the shell costs
  // nothing extra.
  const member = name ? null : await currentMember();
  const who: string = name ?? member?.full_name ?? "You";

  const spaces = SPACES[kind] ?? SPACES.member;
  const dark = kind === "admin" || kind === "global";
  const home = WORKSPACE_START[kind] ?? "/home";

  return (
    <div className={`mapp v2 ${spaces.length > 1 ? "" : "no-rail"} ${dark ? "admin" : ""} shell-${kind}`}>
      <WorkspaceNav kind={kind} name={who} dark={dark} />

      <div className="mmain">
        <header className="mtop">
          <Link className="logo mlogo" href={home}>
            <span className={`mark${dark ? " alt" : ""}`} aria-hidden="true">
              EP
            </span>
            {WORKSPACE_NAME[kind] ?? "Your space"}
          </Link>
          <Link className="cmd" href={searchHref ?? "/search"}>
            <Ic name="search" />
            <span>{searchText ?? "Search people, businesses, events"}</span>
            <em>Search</em>
          </Link>
          <span className="spacer" />
          {switchTo ? (
            <Link className="btn btn-ghost btn-sm hide-m" href={switchTo[1]}>
              {switchTo[0]}
            </Link>
          ) : null}
          <Link className="iconbtn" aria-label="Notifications" href="/notifications">
            <Ic name="bell" />
            <span className="dot" />
          </Link>
          <Link className="show-m" href="/more">
            <Av name={who} className="av-sm" />
          </Link>
        </header>

        <div className="mbody">{children}</div>
      </div>
    </div>
  );
}

// pagehead
export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="pagehead">
      <div>
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="row" style={{ flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}