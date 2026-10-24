# 94-the-root-is-the-website.ps1
# The wordmark goes to the website, not into the app. No migration.
#
# You are right, and it was one line. The root address always served the
# public home page, to a member as much as to a stranger, and nothing
# redirected anywhere. But the wordmark in the header did: signed in, it
# pointed at /home. So the one thing everybody clicks to get back to the
# website took a member into the member area instead, which is the
# conflict you saw.
#
# The wordmark now goes to / for everybody, as it does in the prototype.
# Getting into the member area stays a deliberate move, which is what
# Your home and Your Village beside it are for.
#
# One thing that followed from it. On a phone the workspace bar was also
# showing the wordmark, directly under the real one. It now names the
# workspace instead: Your space, Local Admin, Global team, Leader tools
# or Educator.
#
#   powershell -ExecutionPolicy Bypass -File .\94-the-root-is-the-website.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
import Link from "next/link";
import { currentMember } from "@/lib/member";
import { Ic } from "@/components/icon";
import { Logo } from "@/components/brand";
import { Av } from "@/components/bits";

const PUBNAV: [string, string][] = [
  ["/discover", "Discover"],
  ["/how-it-works", "How it works"],
  ["/membership", "Membership"],
  ["/events", "Events"],
  ["/watch", "Watch & Listen"],
];

// The header, on every page of the site. Signed out it offers the way
// in; signed in it offers the way to your own pages. The links across
// the middle never change, so the site is always navigable from the top.
export async function SiteHeader() {
  const member = await currentMember();
  const user = member;
  const name = member?.full_name ?? null;

  return (
    <header className="pubhead">
      <div className="in">
        {/* The wordmark is the site, so it always goes to the front door.
            Getting into the member area is a deliberate move, which is
            what Your home beside it is for. */}
        <Logo href="/" />

        <nav className="pubnav">
          {PUBNAV.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        {user ? (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/search">
              <Ic name="search" />
            </Link>
            <Link className="loginlink hide-m" href="/home" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Your home
            </Link>
            <Link className="btn btn-ghost btn-sm hide-m" href="/my-village">
              Your Village
            </Link>
            <Link href="/me" aria-label={name ?? "You"}>
              <Av name={name ?? "You"} className="av-sm" />
            </Link>
          </>
        ) : (
          <>
            <Link className="iconbtn hide-m" aria-label="Search" href="/discover">
              <Ic name="search" />
            </Link>
            <Link className="loginlink" href="/login" style={{ fontWeight: 600, color: "var(--navy)" }}>
              Log in
            </Link>
            <Link className="btn btn-primary btn-sm hide-m" href="/apply">
              Request your invitation
            </Link>
          </>
        )}

        <Link className="iconbtn menubtn" aria-label="Menu" href={user ? "/more" : "/menu"}>
          <Ic name="menu" />
        </Link>
      </div>
    </header>
  );
}
'@
Write-File "components\site-header.tsx" $f0

$f1 = @'
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
'@
Write-File "components\workspace-shell.tsx" $f1

git add .
git commit -m "The wordmark goes to the website rather than into the app"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
