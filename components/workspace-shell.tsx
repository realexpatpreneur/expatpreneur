import Link from "next/link";
import { currentMember, currentRoles, workspacesFor } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { Ic } from "@/components/icon";
import { SidebarToggle } from "@/components/sidebar-toggle";
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
  const [member, roles] = await Promise.all([
    name ? Promise.resolve(null) : currentMember(),
    currentRoles(),
  ]);
  const who: string = name ?? member?.full_name ?? "You";
  const face = member?.avatar_url ?? null;

  // How many are actually unread, for the dot. Own rows only, which the
  // notifications policy already enforces, and a head count rather than
  // the rows themselves because the number is all this needs.
  let unread = 0;
  if (member?.id) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", member.id)
      .is("read_at", null);
    unread = count ?? 0;
  }

  const spaces = SPACES[kind] ?? SPACES.member;
  const dark = kind === "admin" || kind === "global";
  const home = WORKSPACE_START[kind] ?? "/home";

  return (
    <div className={`mapp v2 ws ${spaces.length > 1 ? "" : "no-rail"} ${dark ? "admin" : ""} shell-${kind}`}>
      <WorkspaceNav
        kind={kind}
        name={who}
        dark={dark}
        avatar={face}
        workspaces={workspacesFor(roles)}
        sub={kind === "member" && member?.villageName ? `${member.villageName} Village` : undefined}
      />

      <div className="mmain">
        <header className="mtop">
        <SidebarToggle />
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
          {kind === "member" ? (
            <Link className="btn btn-primary m-postbtn hide-m" href="/village/new">
              <Ic name="plus" />
              Post an Ask or Offer
            </Link>
          ) : null}
          {/* The dot was rendered unconditionally, on every member page,
              for ever. Nothing counted anything, and /notifications marks
              everything read as soon as it is opened, so it said there was
              something new whether or not there was, which is the same as
              saying nothing. */}
          <Link className="iconbtn" aria-label="Notifications" href="/notifications">
            <Ic name="bell" />
            {unread > 0 ? <span className="dot" /> : null}
          </Link>
          <Link className="show-m" href="/more">
            <Av name={who} className="av-sm" src={face} />
          </Link>
        </header>

        <div className="mbody">{children}</div>
      </div>

      {kind === "member" ? (
        <Link className="m-fab" href="/village/new" aria-label="Post an Ask or Offer">
          <Ic name="plus" />
        </Link>
      ) : null}
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