# 98-the-proxy-was-closing-the-public-site.ps1
# Found it. No migration.
#
# There is a file called proxy.ts at the root of the repository. In Next
# 16 that is what middleware is called, and it runs before every single
# request. I had been searching for middleware.ts, found none, and told
# you twice there was no middleware. There was. That is the whole reason
# I could not explain any of this.
#
# It decides whether to send you to the sign in page by checking whether
# the address starts with one of a list of words. Two of those words eat
# public pages:
#
#   /villages starts with /village, which is Ask & Offer. So Villages,
#   every Village page and Suggest a city were all shut to the public.
#
#   /membership starts with /members. So the Membership page, the one
#   linked from the header, the footer twice and the foot of How it
#   works, was shut to the public.
#
# And /events, /businesses, /learning and /members were in the list
# outright, from when they were member only, and were never taken out
# when they became public.
#
# The other half of your report is the same bug from the other side.
# /me, /more, /for-you and /network were not in the list at all, so the
# proxy let strangers straight through to them.
#
# The gate now matches whole addresses instead of the starts of strings:
# a path is in an area only if it is that address or something beneath
# it. Public pages are listed separately and can never be gated whatever
# else the lists say. I ran every address in your report against the new
# rule before writing this: eighteen that must open now open, and twenty
# that must be closed are closed.
#
# lib/route-areas.test.md writes down which is which, so the next person
# to add a page can see where it belongs.
#
# recon.ps1 is updated too. Its list of pages that should be closed was
# missing the four that leaked, which is why it only caught them by
# accident.
#
# After this deploys, run both again:
#   powershell -ExecutionPolicy Bypass -File .\recon.ps1
#   node audit.mjs
#
#   powershell -ExecutionPolicy Bypass -File .\98-the-proxy-was-closing-the-public-site.ps1

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
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The member area, by exact address. Matching on the start of a string
// was what closed the public site: "/villages" starts with "/village",
// and "/membership" starts with "/members", so three public pages and
// the whole Villages section turned visitors away.
//
// A path counts as being in one of these only if it is the address
// itself or something underneath it, which is what the slash does.
const MEMBER_ONLY = [
  "/home",
  "/welcome",
  "/village", // Ask & Offer. Not /villages, which is public.
  "/my-village",
  "/my-circle",
  "/circles",
  "/directory",
  "/me",
  "/more",
  "/for-you",
  "/network",
  "/messages",
  "/notifications",
  "/market-exploration",
  "/suggestions",
  "/library",
  "/photos",
  "/search",
  "/upgrade",
  "/settings",
  "/report",
  "/groups",
  "/pods",
  "/jobs",
  "/renew",
  "/markets",
  "/live",
  "/educator",
  "/lead",
  "/admin",
  "/global",
];

// These are open to everybody, and several of them show a member more
// than they show a visitor. None of them may ever be gated here.
const ALWAYS_OPEN = [
  "/",
  "/discover",
  "/how-it-works",
  "/membership",
  "/villages",
  "/events",
  "/businesses",
  "/learning",
  "/media",
  "/watch",
  "/members",
  "/contact",
  "/apply",
  "/login",
  "/legal",
  "/menu",
  "/e",
  "/reset-password",
  "/auth",
  "/api",
];

const inArea = (path: string, list: string[]) =>
  list.some((entry) => path === entry || path.startsWith(entry + "/"));

// Keeps the session cookie fresh, and sends signed out people away from
// the member space and the workspaces.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // A page that is open to everybody is never gated, whatever else the
  // lists say.
  if (inArea(path, ALWAYS_OPEN)) return response;

  if (!user && inArea(path, MEMBER_ONLY)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
'@
Write-File "lib\supabase\middleware.ts" $f0

$f1 = @'
# Which addresses are open and which are not

The gate lives in one place, `lib/supabase/middleware.ts`, and matches
whole addresses rather than the start of a string. The rule is: a path
is in an area only if it is that address or something underneath it.

Open to everybody. None of these may ever be gated.

    /                    /discover            /how-it-works
    /membership          /villages            /villages/dubai
    /villages/suggest    /events              /businesses
    /learning            /media               /watch
    /members             /members/<id>        /contact
    /apply               /login               /legal/...
    /menu                /e/<event>           /reset-password

Members only. A visitor is sent to the sign in page.

    /home        /welcome      /village      /my-village
    /my-circle   /circles      /directory    /me
    /more        /for-you      /network      /messages
    /notifications             /market-exploration
    /suggestions /library      /photos       /search
    /upgrade     /settings     /report       /groups
    /pods        /jobs         /renew        /markets
    /live        /educator     /lead         /admin
    /global

The two that caught us: `/villages` begins with `/village`, and
`/membership` begins with `/members`. Under the old rule both were
treated as member pages and shut to the public.
'@
Write-File "lib\route-areas.test.md" $f1

$f9 = @'
# recon.ps1
# Interrogates the deployed site and writes down what it finds. It
# changes nothing, signs in to nothing, and needs no keys.
#
#   powershell -ExecutionPolicy Bypass -File .\recon.ps1
#   powershell -ExecutionPolicy Bypass -File .\recon.ps1 -Base "https://expatpreneur.vercel.app"
#
# It writes two files beside itself:
#   recon-report.md    what it found, in order of how much it matters
#   recon-links.csv    every internal link it followed, and what came back

param(
  [string]$Base = "https://expatpreneur.vercel.app"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Base = $Base.TrimEnd('/')
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"

# ---------------------------------------------------------------- fetching

function Get-Page($url) {
  $out = [pscustomobject]@{
    Url = $url; Status = 0; Location = $null; Body = ''; Headers = @{}
  }
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 `
         -TimeoutSec 40 -Headers @{ 'Cache-Control' = 'no-cache' }
    $out.Status = [int]$r.StatusCode
    $out.Body = [string]$r.Content
    $out.Headers = $r.Headers
    if ($r.Headers['Location']) { $out.Location = [string]$r.Headers['Location'] }
  }
  catch {
    $resp = $_.Exception.Response
    if ($resp -ne $null) {
      try { $out.Status = [int]$resp.StatusCode } catch { $out.Status = 0 }
      try { $out.Location = [string]$resp.Headers['Location'] } catch { }
      try {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $out.Body = $reader.ReadToEnd()
        $reader.Close()
      } catch { }
    }
  }
  return $out
}

function Has($body, $text) { return ($body -and $body.IndexOf($text, [StringComparison]::OrdinalIgnoreCase) -ge 0) }

function CssHash($body) {
  $m = [regex]::Match($body, '/_next/static/css/([^"''>]+)\.css')
  if ($m.Success) { return $m.Groups[1].Value } else { return '' }
}

# ------------------------------------------------- what each page must have
# The words come from the prototype. If one is missing, that page is not
# saying what was approved.

$public = @(
  @{ Path = '/';              Name = 'Home';              Must = @('Your business needs a village too', 'It takes a village to raise a child', 'Big enough to open doors', 'What members do here', 'Ready to find your Village') }
  @{ Path = '/discover';      Name = 'Discover';          Must = @('there is a Village for you', 'Search Villages', 'Featured', 'Villages', 'Members you will meet') }
  @{ Path = '/how-it-works';  Name = 'How it works';      Must = @('How ExpatPreneurs works', 'Global', 'Village', 'Circle', 'Industry Groups', 'Pods', 'Where things happen', 'From invitation to your Circle') }
  @{ Path = '/membership';    Name = 'Membership';        Must = @('Membership', 'By application', 'Paid member', 'What we expect from members', 'Questions') }
  @{ Path = '/villages';      Name = 'Villages';          Must = @('Find your Village', 'Launching soon', 'No Village in your city yet', 'Suggest your city') }
  @{ Path = '/villages/dubai';Name = 'A Village page';    Must = @('Village', 'Request an invitation') }
  @{ Path = '/villages/suggest'; Name = 'Suggest a city'; Must = @('city', 'Send') }
  @{ Path = '/events';        Name = 'Events';            Must = @('Events') }
  @{ Path = '/businesses';    Name = 'Businesses';        Must = @('Businesses') }
  @{ Path = '/learning';      Name = 'Learning';          Must = @('Learning', 'Live', 'Recorded', 'Free', 'Teach in the network') }
  @{ Path = '/media';         Name = 'Media';             Must = @('Media') }
  @{ Path = '/watch';         Name = 'Watch and Listen';  Must = @('Watch') }
  @{ Path = '/members';       Name = 'Members';           Must = @('Members') }
  @{ Path = '/contact';       Name = 'Contact';           Must = @('Contact us', 'General', 'Partnerships', 'Press', 'Send') }
  @{ Path = '/apply';         Name = 'Request an invitation'; Must = @('First name', 'Last name', 'Phone', 'City', 'Nationalities', 'Countries you have lived in', 'stage', 'biggest challenge', 'resonate', 'code of conduct', 'give back') }
  @{ Path = '/apply/status';  Name = 'Invitation status'; Must = @('invitation') }
  @{ Path = '/login';         Name = 'Log in';            Must = @('Log in') }
  @{ Path = '/legal/privacy'; Name = 'Privacy';           Must = @('Privacy', 'Terms', 'Cookies') }
  @{ Path = '/legal/terms';   Name = 'Terms';             Must = @('Privacy', 'Terms', 'Cookies') }
  @{ Path = '/legal/cookies'; Name = 'Cookies';           Must = @('Privacy', 'Terms', 'Cookies') }
  @{ Path = '/menu';          Name = 'Menu';              Must = @('Membership') }
  @{ Path = '/this-page-does-not-exist'; Name = 'The 404'; Must = @('not here') }
)

# These must NOT open to a stranger. If one returns a page, it is a leak.
$gated = @(
  '/home', '/my-village', '/my-village/members', '/my-village/circles',
  '/village', '/village/new', '/circles', '/my-circle',
  '/directory', '/messages', '/notifications', '/settings', '/me',
  '/library', '/jobs', '/pods', '/groups', '/network', '/for-you',
  '/markets', '/market-exploration', '/search', '/suggestions', '/more',
  '/photos', '/report', '/renew', '/upgrade', '/live', '/welcome',
  '/admin', '/admin/members', '/admin/applications', '/admin/mix',
  '/global', '/global/villages', '/global/money',
  '/lead', '/educator'
)

Write-Host "Looking at $Base" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------- public pages

$results = @()
$cssHashes = @{}
$allLinks = New-Object System.Collections.Generic.HashSet[string]

foreach ($page in $public) {
  $url = "$Base$($page.Path)?recon=$(Get-Random)"
  $r = Get-Page $url
  $missing = @()
  if ($r.Status -eq 200) {
    foreach ($m in $page.Must) { if (-not (Has $r.Body $m)) { $missing += $m } }
    $hash = CssHash $r.Body
    if ($hash) { $cssHashes[$page.Path] = $hash }
    foreach ($mm in [regex]::Matches($r.Body, 'href="(/[^"#?]*)"')) {
      [void]$allLinks.Add($mm.Groups[1].Value)
    }
  }
  $results += [pscustomobject]@{
    Name      = $page.Name
    Path      = $page.Path
    Status    = $r.Status
    Goes      = $r.Location
    Header    = (Has $r.Body 'class="pubhead"')
    Footer    = (Has $r.Body 'class="pubfoot"')
    Missing   = ($missing -join '; ')
    Bytes     = $r.Body.Length
  }
  $flag = if ($r.Status -ne 200) { "$($r.Status)" } elseif ($missing.Count) { "$($missing.Count) missing" } else { "ok" }
  Write-Host ("  {0,-28} {1}" -f $page.Name, $flag)
}

# ----------------------------------------------------------- gated pages

Write-Host ""
Write-Host "Pages that should be closed to a stranger" -ForegroundColor Cyan
$leaks = @()
foreach ($path in $gated) {
  $r = Get-Page "$Base$path"
  $closed = ($r.Status -ge 300 -and $r.Status -lt 400) -or $r.Status -eq 401 -or $r.Status -eq 403 -or $r.Status -eq 404
  if (-not $closed) {
    $leaks += [pscustomobject]@{ Path = $path; Status = $r.Status; Bytes = $r.Body.Length }
    Write-Host ("  {0,-28} OPEN ({1})" -f $path, $r.Status) -ForegroundColor Red
  }
}
if ($leaks.Count -eq 0) { Write-Host "  all closed" -ForegroundColor Green }

# --------------------------------------------------------------- the links

Write-Host ""
Write-Host "Following every internal link" -ForegroundColor Cyan
$linkRows = @()
$i = 0
foreach ($link in ($allLinks | Sort-Object)) {
  $i++
  if ($i -gt 250) { break }
  $r = Get-Page "$Base$link"
  $linkRows += [pscustomobject]@{
    Link = $link
    Status = $r.Status
    GoesTo = $r.Location
  }
  if ($r.Status -eq 404 -or $r.Status -ge 500 -or $r.Status -eq 0) {
    Write-Host ("  {0,-40} {1}" -f $link, $r.Status) -ForegroundColor Red
  }
}
$broken = $linkRows | Where-Object { $_.Status -eq 404 -or $_.Status -ge 500 -or $_.Status -eq 0 }
if ($broken.Count -eq 0) { Write-Host "  nothing broken" -ForegroundColor Green }

# ------------------------------------------------------------- one build?

$hashes = $cssHashes.Values | Sort-Object -Unique
$mixed = $hashes.Count -gt 1

# ---------------------------------------------------------------- write up

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# What the live site is doing")
$md.Add("")
$md.Add("$Base, looked at on $stamp.")
$md.Add("")
$md.Add("Nothing here is from the code. Every line below is what the site")
$md.Add("returned when asked.")
$md.Add("")

$md.Add("## Is it all one build?")
$md.Add("")
if ($mixed) {
  $md.Add("No. The pages are not serving the same stylesheet, which means")
  $md.Add("some of them are cached from an older deployment. Until that is")
  $md.Add("true, nothing else in this report can be trusted as current.")
  $md.Add("")
  foreach ($k in $cssHashes.Keys | Sort-Object) { $md.Add("- ``$k`` -> $($cssHashes[$k])") }
} else {
  $md.Add("Yes. Every page served the same stylesheet, $($hashes -join ''), so")
  $md.Add("what follows is one deployment rather than several.")
}
$md.Add("")

$md.Add("## Pages that did not open")
$md.Add("")
$bad = $results | Where-Object { $_.Status -ne 200 }
if ($bad) {
  $md.Add("| Page | Address | Came back | Sent to |")
  $md.Add("| --- | --- | --- | --- |")
  foreach ($r in $bad) { $md.Add("| $($r.Name) | ``$($r.Path)`` | $($r.Status) | $($r.Goes) |") }
  $md.Add("")
  $md.Add("A public page that sends a visitor to the sign in page is the worst")
  $md.Add("kind of fault here: the link is on the site, and it goes nowhere useful.")
} else { $md.Add("None. Every public page opened.") }
$md.Add("")

$md.Add("## Pages missing their approved wording")
$md.Add("")
$gaps = $results | Where-Object { $_.Status -eq 200 -and $_.Missing }
if ($gaps) {
  foreach ($r in $gaps) {
    $md.Add("### $($r.Name)")
    $md.Add("``$($r.Path)``. Not found on the page: $($r.Missing).")
    $md.Add("")
  }
} else { $md.Add("None. Every page said what the prototype says.") }
$md.Add("")

$md.Add("## Pages missing the header or the footer")
$md.Add("")
$chrome = $results | Where-Object { $_.Status -eq 200 -and ((-not $_.Header) -or (-not $_.Footer)) }
if ($chrome) {
  $md.Add("| Page | Header | Footer |")
  $md.Add("| --- | --- | --- |")
  foreach ($r in $chrome) { $md.Add("| $($r.Name) | $($r.Header) | $($r.Footer) |") }
} else { $md.Add("None. Every page kept both.") }
$md.Add("")

$md.Add("## Member pages open to a stranger")
$md.Add("")
if ($leaks) {
  $md.Add("| Address | Came back |")
  $md.Add("| --- | --- |")
  foreach ($l in $leaks) { $md.Add("| ``$($l.Path)`` | $($l.Status) |") }
  $md.Add("")
  $md.Add("Each of these should have turned a stranger away and did not.")
} else { $md.Add("None. Every one of them turned a stranger away.") }
$md.Add("")

$md.Add("## Links that lead nowhere")
$md.Add("")
if ($broken) {
  $md.Add("| Link | Came back |")
  $md.Add("| --- | --- |")
  foreach ($b in $broken) { $md.Add("| ``$($b.Link)`` | $($b.Status) |") }
} else { $md.Add("None. Every internal link on the public site answered.") }
$md.Add("")

$md.Add("## Every page, in full")
$md.Add("")
$md.Add("| Page | Address | Status | Bytes | Missing |")
$md.Add("| --- | --- | --- | --- | --- |")
foreach ($r in $results) {
  $md.Add("| $($r.Name) | ``$($r.Path)`` | $($r.Status) | $($r.Bytes) | $($r.Missing) |")
}
$md.Add("")

$reportPath = Join-Path $PSScriptRoot "recon-report.md"
$linksPath  = Join-Path $PSScriptRoot "recon-links.csv"

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($reportPath, ($md -join "`r`n"), $utf8)

# The links file opens in Excel, so it carries the mark that stops it
# mangling anything accented.
$linkRows | Export-Csv -Path $linksPath -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "Written:" -ForegroundColor Cyan
Write-Host "  $reportPath"
Write-Host "  $linksPath"
Write-Host ""
if ($mixed) {
  Write-Host "The site is serving more than one build. Redeploy before reading the rest." -ForegroundColor Yellow
}
Write-Host ("Pages checked: {0}. Did not open: {1}. Missing wording: {2}. Leaks: {3}. Broken links: {4}." -f `
  $results.Count, ($bad | Measure-Object).Count, ($gaps | Measure-Object).Count, ($leaks | Measure-Object).Count, ($broken | Measure-Object).Count)
'@
Write-File "recon.ps1" $f9

git add .
git commit -m "The proxy was shutting the public site: match whole addresses, not prefixes"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. When it has deployed, run recon.ps1 again."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
