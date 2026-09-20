import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Ic } from "@/components/icon";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Av } from "@/components/bits";
import { SPACES, WORKSPACE_START } from "@/components/spaces";

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
  let who: string = name ?? "";
  if (!who) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("member_records")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      who = profile?.full_name ?? user.email ?? "You";
    } else {
      who = "You";
    }
  }

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
            ExpatPreneurs
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