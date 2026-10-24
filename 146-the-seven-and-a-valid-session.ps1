# 146-the-seven-and-a-valid-session.ps1
# The seven failures were mine. So was wasting a whole signed in pass.
#
# WHY THE SEVEN FAILED
#
# /apply, /contact and /villages/suggest failed in both runs, both
# times on a navigation timeout, and raising the budget from 30 to 45
# seconds changed nothing. Those are the three pages carrying the
# Turnstile captcha. The widget keeps polling, so "networkidle" never
# arrives and the wait never ends. This waits for the document instead
# and then gives the page a moment to settle, which is the right
# condition for a page with a third party widget on it.
#
# /admin/circles failed once and not in the first run, so it is an
# ordinary timeout. Anything that fails now is retried once.
#
# WHY THE SIGNED IN HALF WAS VOID
#
# 105 of 135 pages landed on the login page, so auth.json had expired
# and the whole pass recorded login screens. This checks the session
# before it starts and stops if it is dead, rather than spending ten
# minutes producing nothing.
#
# If it stops, run this, sign in, press Enter, and run this script
# again:
#     node audit.mjs --login
#
# IT ALSO SENDS ME THE EIGHT FILES THAT DIFFER
#
# The comparison came back 443 identical of 451. For the handful that
# are not, I need to read your version rather than guess at it, so
# those files are zipped up too. Nothing else is read.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\tools\dump-live-pages.mjs
#   C:\Users\HP\Desktop\expatpreneur\live-pages.zip
#   C:\Users\HP\Desktop\expatpreneur\your-versions.zip
#
#   powershell -ExecutionPolicy Bypass -File .\146-the-seven-and-a-valid-session.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $full"
}

# ------------------------------------------- the files I need to read

$wanted = @(
    "package.json",
    "app\global\page.tsx",
    "components\member-nav.tsx",
    "components\readiness.tsx",
    "supabase\migrations\0044_cron_in_supabase.sql"
)

$stage = Join-Path $root "your-versions"
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

foreach ($rel in $wanted) {
    $src = Join-Path $root $rel
    if (Test-Path -LiteralPath $src) {
        $dest = Join-Path $stage $rel
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item -LiteralPath $src -Destination $dest
        Write-Host "staged $rel"
    } else {
        Write-Host "not here: $rel"
    }
}

if (Test-Path -LiteralPath "your-versions.zip") { Remove-Item -LiteralPath "your-versions.zip" }
Compress-Archive -Path "$stage\*" -DestinationPath "your-versions.zip" -Force
Remove-Item -LiteralPath $stage -Recurse -Force

# ------------------------------------------------------- the dump

$dump = @'
// Save what the browser actually built, for every page on the list.
//
// Waits for the document rather than for the network to fall silent,
// because a page carrying a captcha never falls silent. Checks the
// session first, so a dead auth.json costs one page rather than the
// whole run. Retries anything that fails, once, with more room.

import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = process.env.AUDIT_BASE || "https://expatpreneur.vercel.app";
const OUT = "live-pages";

const paths = JSON.parse(await readFile("tools/page-list.json", "utf8"));
console.log(`${paths.length} addresses on the list`);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const viewport = { width: 1360, height: 900 };
const signedOut = await browser.newContext({ viewport });
const signedIn = existsSync("auth.json")
  ? await browser.newContext({ storageState: "auth.json", viewport })
  : null;

// Is the saved session still alive? One page tells us.
let sessionOK = false;
if (signedIn) {
  const probe = await signedIn.newPage();
  try {
    await probe.goto(BASE + "/home", { waitUntil: "domcontentloaded", timeout: 30000 });
    sessionOK = new URL(probe.url()).pathname === "/home";
  } catch {}
  await probe.close();
}

if (signedIn && !sessionOK) {
  await browser.close();
  console.log("");
  console.log("  The saved session has expired, so the signed in pass would");
  console.log("  record 135 login pages. Stopping before it wastes your time.");
  console.log("");
  console.log("  Run this, sign in, press Enter, then run the script again:");
  console.log("      node audit.mjs --login");
  console.log("");
  process.exit(1);
}

const name = (who, p) => `${who}${p === "/" ? "_root" : p.replace(/[/?=&]/g, "_")}.html`;

async function grab(page, who, p, timeout) {
  const res = await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout });
  // Let a client component or two finish, without waiting on a widget
  // that never stops talking.
  await page.waitForTimeout(1200);
  const html = await page.content();
  const landed = new URL(page.url()).pathname;
  const header = `<!-- asked for ${p} | landed on ${landed} | status ${res ? res.status() : "?"} | ${who} -->\n`;
  await writeFile(`${OUT}/${name(who, p)}`, header + html);
  return landed;
}

let saved = 0, failed = 0, bounced = 0;
const stillFailing = [];

for (const [who, context] of [["out", signedOut], ["in", signedIn]]) {
  if (!context) continue;
  const page = await context.newPage();
  for (const p of paths) {
    let landed = null;
    try {
      landed = await grab(page, who, p, 30000);
    } catch {
      try {
        landed = await grab(page, who, p, 60000);   // one retry, more room
      } catch (err) {
        failed++;
        stillFailing.push(`${who} ${p}: ${err.message.split("\n")[0]}`);
        await writeFile(`${OUT}/${name(who, p)}`, `<!-- FAILED ${p}: ${err.message} -->`);
        process.stdout.write("x");
        continue;
      }
    }
    if (who === "in" && landed && landed.startsWith("/login")) bounced++;
    saved++;
    process.stdout.write(".");
  }
  await page.close();
  console.log("");
}

await browser.close();
console.log(`\nSaved ${saved}, failed ${failed}.`);
if (bounced) console.log(`${bounced} signed in pages still landed on the login page.`);
if (stillFailing.length) {
  console.log("\nStill failing after a retry:");
  for (const line of stillFailing) console.log("  " + line);
}
'@
Write-File "tools\dump-live-pages.mjs" $dump

Write-Host ""
Write-Host "=== Saving what the live site renders ==="
Write-Host ""

node "tools\dump-live-pages.mjs"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Stopped. Sign in and run this script again."
    exit 1
}

if (Test-Path -LiteralPath "live-pages.zip") { Remove-Item -LiteralPath "live-pages.zip" }
Compress-Archive -Path "live-pages\*" -DestinationPath "live-pages.zip" -Force

$a = [math]::Round((Get-Item "live-pages.zip").Length / 1MB, 1)
$b = [math]::Round((Get-Item "your-versions.zip").Length / 1KB, 0)
Write-Host ""
Write-Host "Done. Send these two back:"
Write-Host "  C:\Users\HP\Desktop\expatpreneur\live-pages.zip      ($a MB)"
Write-Host "  C:\Users\HP\Desktop\expatpreneur\your-versions.zip   ($b KB)"
Write-Host ""
